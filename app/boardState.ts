import RobotProxy from './robotproxy';

class BoardState {

	constructor(width: number, height: number, robots:RobotProxy[]) {
		this.width = width;
		this.height =  height;
		this.entities = {
			robots:robots,
			regens:[],
			explosions:[],
			shields:[]
		};

		this.grid = {}
		for (const robot of robots) {
			let placeX, placeY;
			do {
				placeX = Math.random()*width;
				placeY = Math.random()*height;
			} while (grid[placeX+","+placeY] === undefined)


		}

	}
}
