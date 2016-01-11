import * as wire from './wire';
import RobotProxy from './robotproxy';
import { RobotGameObject, RegenGameObject, ExplosionGameObject, ShieldGameObject } from './robotgamestate';

export class GameState {

	constructor(public width: number, public height: number, robotproxies:RobotProxy[]) {
		this.entities = {
			robots:[],
			regens:[],
			explosions:[],
			shields:[]
		};

		this.grid = {}
		let placeX, placeY;
		for (const robot of robots) {
			// find a location where we can put our robot
			do {
				placeX = Math.random()*width;
				placeY = Math.random()*height;
			} while (grid[placeX+","+placeY] === undefined)

			// create our robot with that location
		}

	}
}
