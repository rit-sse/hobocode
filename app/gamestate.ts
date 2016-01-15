import * as wire from './wire';
import RobotProxy from './robotproxy';
import { RobotGameObject, RegenGameObject } from './gameobjects';

function randomInteger(max: number, min = 0) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function directionToLoaction(location: wire.Point, direction: wire.CardinalDirection) {
    const newLoc = {x: location.x, y: location.y};
    switch (direction) {
        case wire.CardinalDirection.East:
            newLoc.x += 1;
        case wire.CardinalDirection.South:
            newLoc.y -= 1;
        case wire.CardinalDirection.West:
            newLoc.x -= 1;
        case wire.CardinalDirection.North:
            newLoc.y += 1;
    }
    return newLoc;
}

function toKey(location: wire.Point) {
    return `${location.x},${location.y}`;
}

export interface GameFrame {
    robots: (wire.RobotState & {shielded: boolean})[];
    regens: wire.RegenData[];
    shots_fired: {from: wire.Point, to: wire.Point, radius: number}[];
}

export class GameState {
    private frames: GameFrame[] = [];
    public entities: {
        robots: RobotGameObject[],
        regens: RegenGameObject[],
    };
    private grid: {[index: string]: boolean};
    constructor(public width: number, public height: number, robots: {code: string}[]) {
        this.entities = {
            robots: [],
            regens: [],
        };

        this.grid = {};
        let counter = 0;
        // TODO change to map
        for (const robot of robots) {
            // find a location where we can put our robot
            const robotLocation = this.getAvailableLocation();
            this.markLocation(robotLocation);

            // create our robot with that location
            let robotId = (counter++).toString();
            this.entities.robots.push( new RobotGameObject(robotId, robot.code,
                wire.Health, wire.Costs.income, robotLocation) );
        }

        this.spawnRegens(robots.length - 1);

        this.entities.robots.forEach(robot => robot.setupProxy(this.entities.robots.map(robot2 => this.initialInfoForOf(robot, robot2)), {x: width, y: height}));
    }

    runMatch() {
        return Promise.all(
            this.entities.robots.map(robot => {
                robot.generateTickDataAndReset(this);
                return robot.proxy.getTurn(this.getStateFor(robot)).then(response => response, this.createBotErrorHandler(robot));
            })
        ).then(data => this.handleResponses(data));
    }

    createBotErrorHandler(robot: RobotGameObject) {
        return (err: any): wire.ActionMessage[] => {
            // If the bot errors out, replace it with a do-nothing script
            robot.proxy.destroy();
            robot.code = 'this.hold(); this.finalize_moves();';
            robot.setupProxy(this.entities.robots.map(robot2 => this.initialInfoForOf(robot, robot2)), {x: this.width, y: this.height});
            return [];
        };
    }

    startNextTurn() {
        this.grantTurnIncome();
        return Promise.all(
            this.entities.robots.map(robot => robot.proxy.getTurn(this.getStateFor(robot)).then(response => response, this.createBotErrorHandler(robot)))
        ).then(data => this.handleResponses(data));
    }

    handleResponses(listOfActionMessages: wire.ActionMessage[][]): Promise<GameFrame[]> {
        this.simulateTurn(listOfActionMessages);
        if (this.entities.robots.length <= 1) {
            // GAME OVER, return game frames/declare winner
            return Promise.resolve(this.frames);
        } else {
            return this.startNextTurn();
        }
    }

    removeDeadBots() {
        this.entities.robots = this.entities.robots.filter(bot => {
            if (bot.health <= 0) {
                bot.proxy.destroy();
            }
            return bot.health > 0;
        });
    }

    grantTurnIncome() {
        this.entities.robots.forEach(bot => {
            bot.shielded = false;
            bot.energy += wire.Costs.income;
            if (bot.energy > wire.MaxEnergy) {
                bot.energy = wire.MaxEnergy;
            }
        });
    }

    pickupRegens() {
        const botLocations: {[index: string]: RobotGameObject} = {};
        for (const bot of this.entities.robots) {
            botLocations[toKey(bot.location)] = bot;
        }
        this.entities.regens = this.entities.regens.filter(regen => {
            const key = toKey(regen.location);
            if (botLocations[key]) {
                const bot = botLocations[key];
                bot.energy += regen.value;
                if (bot.energy > wire.MaxEnergy) {
                    bot.energy = wire.MaxEnergy;
                }
                return false;
            }
            return true;
        });
    }

    getAvailableLocation(): wire.Point {
        let placeX: number, placeY: number;
        let placeLocation = '';
        do {
            placeX = randomInteger(this.width);
            placeY = randomInteger(this.height);
            placeLocation = `${placeX},${placeY}`;
        } while (this.grid[placeLocation] === undefined);
        return {x: placeX, y: placeY};
    }

    markLocation(point: wire.Point) {
        this.grid[toKey(point)] = true;
    }

    clearLocation(point: wire.Point) {
        delete this.grid[toKey(point)];
    }

    spawnRegens(count: number) {
        for (let i = 0; i < count; i++) {
            const loc = this.getAvailableLocation();
            this.markLocation(loc);
            this.entities.regens.push(
                new RegenGameObject(6, loc)
            );
        }
    }

    /**
     * For the first robot, get the initial info the robot knows of the other robot
     * (minimally name, but also position if it is in view)
     */
    initialInfoForOf(forRobot: RobotGameObject, ofRobot: RobotGameObject): wire.RobotData {
        if (forRobot.inRange(ofRobot, wire.ViewDistance)) {
            return {name: ofRobot.name, location: ofRobot.location};
        } else {
            return {name: ofRobot.name};
        }
    }

    getStateFor(robot: RobotGameObject): wire.StateMessageArguments {
        return {
            robot_state: {
                health: robot.health,
                energy: robot.energy,
                location: {
                    x: robot.location.x,
                    y: robot.location.y
                },
                name: robot.name
            },
            tick_info: robot.getTurnResultsAndReset()
        };
    }

    static priority: {[key: string]: number} = {
        'hold': 1,
        'shield': 2,
        'move': 3,
        'shoot': 4,
        'scan': 5,
    };

    simulateTurn(actions: wire.ActionMessage[][]) {
        /**
         * A turn is resolved in as many steps as there are actions for each robot.
         * Each step is resolved as a series of phases (one for each action).
         * 1. Hold
         * 2. Shield
         * 3. Move
         * 4. Shoot
         * 5. Scan
         * Actions in the same phase are resolved simultaneously, with conflicts during move resolved as follows:
         * - If two robots attempt to move into the same space, neither robot moves.
         * If any action is "invalid" - for example movement off the board, shielding for more than allowed, shooting for more than allowed 
         *   - then the requested action is ignored and the robot acts if it had used "hold" instead. Any remaining actions for this turn are discarded.
         */
        const max_steps = actions.reduce((max, actions) => actions.length > max ? actions.length : max, 0);
        const turns: {[index: number]: wire.ActionMessage}[] = [];
        for (let i = 0; i < max_steps; i++) {
            for (let index = 0; index < actions.length; index++) {
                turns[i] = turns[i] || {};
                // Handle malformed messages from bots (in case of rogue bots)
                if (!(actions[index] instanceof Array)) {
                    turns[i][index] = {command: 'hold'};
                } else {
                    turns[i][index] = actions[index][i];
                }
            }
        }

        const exhausted: {[key: string]: boolean} = {};
        turns.forEach(turn => {
            const botAndActions: {bot: RobotGameObject, action: wire.ActionMessage}[] = [];
            for (const key in turn) {
                const bot = this.entities.robots[key];
                const action = turn[key];
                botAndActions.push({bot, action});
            }
            botAndActions
              .sort((a, b) => (GameState.priority[a.action.command] - GameState.priority[b.action.command]))
              .forEach(({bot, action}) => {
                  if (exhausted[bot.name]) {
                      return;
                  }
                  switch (action.command) {
                      case 'hold':
                        exhausted[bot.name] = this.hold(bot, true);
                        break;
                      case 'shield':
                        exhausted[bot.name] = this.shield(bot);
                        break;
                      case 'move':
                        exhausted[bot.name] = this.move(bot, action as wire.MoveActionMessage);
                        break;
                      case 'shoot':
                        this.commitPendingMoves();
                        exhausted[bot.name] = this.shoot(bot, action as wire.ShootActionMessage);
                        break;
                      case 'scan':
                        this.commitPendingMoves();
                        exhausted[bot.name] = this.scan(bot);
                        break;
                      default:
                        this.hold(bot);
                        exhausted[bot.name] = true;
                  }
              });
             this.commitPendingMoves();
             this.removeDeadBots();
             this.entities.robots.forEach(bot => {
                 bot.generateTickDataAndReset(this);
             });
             this.pickupRegens();
             this.snapshotStateForRender();
        });
    }

    snapshotStateForRender() {
        this.frames.push({
            regens: this.entities.regens.map(reg => ({value: reg.value, location: {x: reg.location.x, y: reg.location.y}})),
            robots: this.entities.robots.map(bot => ({health: bot.health, energy: bot.energy, shielded: bot.shielded, name: bot.name, location: {x: bot.location.x, y: bot.location.y}})),
            shots_fired: this.shotsFired,
        });
        this.shotsFired = [];
    }

    hold(robot: RobotGameObject, setResult?: boolean) {
        if (setResult) {
            robot.setResult({type: 'hold', success: true}); // Holds never fail, per sey
        }
        robot.energy -= wire.Costs.moves.hold;
        if (robot.energy < 0) {
            robot.energy = 0;
            return true;
        }
        return false;
    }

    shield(robot: RobotGameObject) {
        robot.energy -= wire.Costs.moves.shield;
        if (robot.energy < 0) {
            robot.energy += wire.Costs.moves.shield;
            robot.setResult({type: 'shield', success: false});
            this.hold(robot);
            return true;
        }
        robot.shielded = true;
        robot.setResult({type: 'shield', success: true});
        this.entities.robots.forEach(bot => {
            if (bot.inRange(robot, wire.ViewDistance)) {
                bot.addObservation({type: 'shield', location: robot.location});
            }
        });
        return false;
    }

    private pendingMoveTargets: {[index: string]: {bots: RobotGameObject[], location: wire.Point}} = {};
    move(robot: RobotGameObject, action: wire.MoveActionMessage): boolean {
        if (!action.arguments) {
            this.hold(robot);
            robot.setResult({type: 'move', success: false});
            return true;
        }
        const direction = action.arguments.direction;
        if (typeof direction !== 'number') {
            this.hold(robot);
            robot.setResult({type: 'move', success: false});
            return true;
        }
        const location = directionToLoaction(robot.location, direction);
        if (0 > location.x || location.x > (this.width - 1)
         || 0 > location.y || location.y > (this.height - 1)) {
            this.hold(robot);
            robot.setResult({type: 'move', success: false, obstacle: wire.ObstacleType.Wall});
            return true;
        }
        const key = toKey(location);
        this.pendingMoveTargets[key] = this.pendingMoveTargets[key] || {location, bots: []};
        this.pendingMoveTargets[key].bots.push(robot);
        return false;
    }

    commitPendingMoves() {
        // Collect a list of all move resolutions (and how to undo them)
        const undo: {[index: string]: {func: () => void, bot: RobotGameObject}} = {};
        for (const key in this.pendingMoveTargets) {
            const {location, bots: [bot]} = this.pendingMoveTargets[key];
            const oldLocation = {x: bot.location.x, y: bot.location.y};
            bot.location.x = location.x;
            bot.location.y = location.y;
            undo[bot.name] = {func: ((bot: RobotGameObject, oldLocation: wire.Point) => () => {
                bot.location.x = oldLocation.x;
                bot.location.y = oldLocation.y;
            })(bot, oldLocation), bot};
        }
        // Collect all robots at each location
        const contents: {[index: string]: {bots: RobotGameObject[], location: wire.Point}} = {};
        this.entities.robots.forEach(bot => {
            const key = toKey(bot.location);
            contents[key] = contents[key] || {location: {x: bot.location.x, y: bot.location.y}, bots: []};
            contents[key].bots.push(bot);
        });
        function undoMovement(undoFunc: () => void, bot: RobotGameObject) {
            undoFunc();
            bot.setResult({type: 'move', success: false, obstacle: wire.ObstacleType.Robot});
            const oldLoc = toKey(bot.location);
            const oldContents = contents[oldLoc];
            contents[oldLoc] = {location: {x: bot.location.x, y: bot.location.y}, bots: [bot]};
            if (oldContents) {
                oldContents.bots.forEach(bot => {
                    const {func: undoFunc} = undo[bot.name];
                    if (undoFunc) {
                        delete undo[bot.name];
                        undoMovement(undoFunc, bot);
                    }
                });
            }
        }
        // Remove all invalid moves
        for (const key of Object.keys(contents)) {
            if (contents[key]) {
                const {location, bots} = contents[key];
                if (bots.length > 1) {
                    bots.forEach(bot => {
                        const {func: undoFunc} = undo[bot.name];
                        if (undoFunc) {
                            delete undo[bot.name];
                            undoMovement(undoFunc, bot);
                        }
                    });
                }
            }
        }
        // Anyone left in the undo map has valid moves
        for (const key in undo) {
            const {bot} = undo[key];
            bot.setResult({type: 'move', success: true});
        }
        this.pendingMoveTargets = {};
    }

    private shotsFired: {from: wire.Point, to: wire.Point, radius: number}[] = [];
    shoot(robot: RobotGameObject, action: wire.ShootActionMessage): boolean {
        if (!action.arguments) {
            this.hold(robot);
            robot.setResult({type: 'shoot', success: false});
            return true;
        }
        const location = action.arguments.location;
        if (!location || typeof location.x !== 'number' || typeof location.y !== 'number') {
            this.hold(robot);
            robot.setResult({type: 'shoot', success: false});
            return true;
        }
        if (0 > location.x || location.x > (this.width - 1)
         || 0 > location.y || location.y > (this.height - 1)) {
            this.hold(robot);
            robot.setResult({type: 'shoot', success: false});
            return true;
        }
        const radius = action.arguments.radius;
        const cost = wire.Costs.moves.shoot[radius];
        if (!cost || typeof radius !== 'number') {
            this.hold(robot);
            robot.setResult({type: 'shoot', success: false});
            return true;
        }
        if (!robot.inRange({location}, wire.FireDistance)) {
            this.hold(robot);
            robot.setResult({type: 'shoot', success: false});
            return true;
        }
        if (robot.energy - cost < 0) {
            this.hold(robot);
            robot.setResult({type: 'shoot', success: false});
            return true;
        }
        robot.energy -= cost;
        const result: wire.ShootResult = {robots_hit: [], success: true, type: 'shoot'};
        const observation: wire.ShotObservation = {location: robot.location, type: 'shot'};
        const explosionObservation: wire.ExplosionObservation = {location, radius, type: 'explosion'};
        this.shotsFired.push({from: observation.location, to: explosionObservation.location, radius});
        this.entities.robots.forEach(bot => {
            if (bot.inRange({location}, radius + 1)) {
                result.robots_hit.push(bot.name);
                if (bot.shielded) {
                    // Should shields only block one shot?
                    bot.shielded = false;
                } else {
                    bot.health -= 1;
                }
            }
            if (bot.inRange({location: observation.location}, wire.ViewDistance)) {
                bot.addObservation(observation);
            }
            if (bot.inRange({location: explosionObservation.location}, wire.ViewDistance)) {
                bot.addObservation(explosionObservation);
            }
        });
        robot.setResult(result);
        return false;
    }

    scan(robot: RobotGameObject): boolean {
        if (robot.energy < wire.Costs.moves.scan) {
            robot.setResult({type: 'scan', success: false});
            this.hold(robot);
            return true;
        }
        robot.energy -= wire.Costs.moves.scan;
        robot.setResult({type: 'scan', success: true, robots: this.entities.robots.filter(bot => robot.inRange(bot, wire.ViewDistance)).map(bot => ({location: bot.location, name: bot.name, energy: bot.energy, health: bot.health}))});
        return false;
    }
}
