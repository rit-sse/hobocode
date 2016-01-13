import * as wire from './wire';
import RobotProxy from './robotproxy';
import { RobotGameObject, RegenGameObject, ExplosionGameObject, ShieldGameObject } from './gameobjects';

export class GameState {
    private entities: { robots:RobotGameObject[],regens:RegenGameObject[],explosions:ExplosionGameObject[],shields:ShieldGameObject[]};
    private grid: {[index: string]: number};
	constructor(public width: number, public height: number, robotProxies:RobotProxy[]) {
		this.entities = {
			robots:[],
			regens:[],
			explosions:[],
			shields:[]
		};

		this.grid = {}
		let placeX: number, placeY: number;
        let counter = 0;
		for (const robotProxy of robotProxies) {
			// find a location where we can put our robot
			do {
				placeX = Math.random()*width;
				placeY = Math.random()*height;
			} while (this.grid[placeX+","+placeY] === undefined)

			// create our robot with that location
            let robotId = (counter++).toString();
            let robotLocation = {
                x: placeX,
                y: placeY
            };
            this.entities.push( new RobotGameObject(robotId, robotProxy,
                wire.Health, wire.Costs.income, robotLocation) );
		}

	}
}
