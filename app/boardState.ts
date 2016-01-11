class BoardState {

	constructor(width: number, height: number, robots:string[]) {
		this.width = width;
		this.height =  height;
		this.entities = {
			robots:robots,
			regens:[],
			explosions:[],
			shields:[]
		};
		

	}

	addRobot(robot: string) {
		this.entities.robots.push(robot);
	}

	removeRobot(x: number, y: number) {
		this.board[x][y] = robot;
	}
}