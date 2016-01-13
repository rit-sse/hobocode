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

		let this.grid = {}
		let placeX: number, placeY: number;
        let placeLocation = "";
        let counter = 0;
        // TODO change to map
		for (const robotProxy of robotProxies) {
			// find a location where we can put our robot
			do {
				placeX = Math.random()*width;
				placeY = Math.random()*height;
                placeLocation = placeX+","+placeY;
			} while (this.grid[placeLocation] === undefined)
            this.grid[placeLocation] = true;

			// create our robot with that location
            let robotId = (counter++).toString();
            let robotLocation = {
                x: placeX,
                y: placeY
            };
            this.entities.push( new RobotGameObject(robotId, robotProxy,
                wire.Health, wire.Costs.income, robotLocation) );
		}

        Promise.all(
            this.entities.robots.map( robot => robot.getTurn(undefined) )
        ).then( (listOfActionMessages: wire.ActionMessage[][]) => {
            
        });

	}
}
