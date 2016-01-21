import React, {Component} from 'react';
import RobotList from 'robotlist';

export class HomePage<P, S> extends Component<P, S> {
	constructor(props) {
		super(props);
	}

	render(){
		let robotlist = [];
		return <div>
			<h1> Hobocode </h1>
			<RobotList robots={robotlist} />
		</div>;
	}
}

export default HomePage;
