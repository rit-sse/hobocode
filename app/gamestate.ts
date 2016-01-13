import * as wire from './wire';
import RobotProxy from './robotproxy';
import { RobotGameObject, RegenGameObject, ExplosionGameObject, ShieldGameObject } from './gameobjects';

export class GameState {
    private entities: {
        robots: RobotGameObject[],
        regens: RegenGameObject[],
        explosions: ExplosionGameObject[],
        shields: ShieldGameObject[]
    };
    private grid: {[index: string]: boolean};
    constructor(public width: number, public height: number, robotProxies: RobotProxy[]) {
        this.entities = {
            robots: [],
            regens: [],
            explosions: [],
            shields: []
        };

        this.grid = {};
        let placeX: number, placeY: number;
        let placeLocation = '';
        let counter = 0;
        // TODO change to map
        for (const robotProxy of robotProxies) {
            // find a location where we can put our robot
            do {
                placeX = Math.random() * width;
                placeY = Math.random() * height;
                placeLocation = `${placeX},${placeY}`;
            } while (this.grid[placeLocation] === undefined);
            this.grid[placeLocation] = true;

            // create our robot with that location
            let robotId = (counter++).toString();
            let robotLocation = {
                x: placeX,
                y: placeY
            };
            this.entities.robots.push( new RobotGameObject(robotId, robotProxy,
                wire.Health, wire.Costs.income, robotLocation) );
        }

        Promise.all(
            this.entities.robots.map(robot => robot.proxy.getTurn(this.getStateFor(robot)))
        ).then(listOfActionMessages => this.simulateTurn(listOfActionMessages));
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
            tick_info: []
        }
    }

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
         *   - then the requested action is ignored and the robot acts if it had used "hold" instead.
         */
         
    }
}
