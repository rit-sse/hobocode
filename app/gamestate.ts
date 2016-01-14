import * as wire from './wire';
import RobotProxy from './robotproxy';
import { RobotGameObject, RegenGameObject } from './gameobjects';

function randomInteger(max: number, min = 0) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export class GameState {
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

        // TODO: Generate correct starting data, loop until match over
        Promise.all(
            this.entities.robots.map(robot => robot.proxy.getTurn(this.getStateFor(robot)))
        ).then(listOfActionMessages => this.simulateTurn(listOfActionMessages));
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
        this.grid[`${point.x},${point.y}`] = true;
    }

    clearLocation(point: wire.Point) {
        delete this.grid[`${point.x},${point.y}`];
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
            tick_info: this.tickInfoFor(robot)
        };
    }

    tickInfoFor(robot: RobotGameObject): wire.TickData[] {
        const data: wire.TickData = {
            in_view: {
                robots: this.entities.robots.filter(bot => robot.inRange(bot, wire.ViewDistance)),
                regens: this.entities.regens.filter(gen => robot.inRange(gen, wire.ViewDistance)),
            },
            observations: [],
            action_result: undefined
        };
        return [data];
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
        // TODO: Build observactions/responses as actions are executed
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
         });
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
        })
        return false;
    }

    move(robot: RobotGameObject, action: wire.MoveActionMessage): boolean {
        // TODO: Store pending moves so that they're all collected into a single "commit" so nothing is done before conflicts get checked
        return false;
    }

    commitPendingMoves() {}

    shoot(robot: RobotGameObject, action: wire.ShootActionMessage): boolean {
        if (!action.arguments) {
            this.hold(robot);
            return true;
        }
        const location = action.arguments.location;
        if (!location || typeof location.x !== 'number' || typeof location.y !== 'number') {
            this.hold(robot);
            return true;
        }
        if (0 > location.x || location.x > (this.width - 1)
         || 0 > location.y || location.y > (this.height - 1)) {
             this.hold(robot);
             return true;
         }
        const radius = action.arguments.radius;
        const cost = wire.Costs.moves.shoot[radius];
        if (!cost || typeof radius !== 'number') {
            this.hold(robot);
            return true;
        }
        if (!robot.inRange({location}, wire.FireDistance)) {
            this.hold(robot);
            return true;
        }
        if (robot.energy - cost < 0) {
            this.hold(robot);
            return true;
        }
        robot.energy -= cost;
        const result: wire.ShootResult = {robots_hit: [], success: true, type: 'shoot'};
        const observation: wire.ShotObservation = {location: robot.location, type: 'shot'};
        const explosionObservation: wire.ExplosionObservation = {location, radius, type: 'explosion'};
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
