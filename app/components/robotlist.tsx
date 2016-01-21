import React, {Component} from 'react';
import RobotItem from 'robotitem';

export class RobotList<P, S> extends Component<P, S> {

	constructor(props) {
		super(props);
	}

	render(){
		let robotitems = this.props.robots.map(robot => {
			return <RobotItem robot={robot} /> 
		});
		return <div>
			{ robotitems }
		</div>;
	}
}

export default RobotList;
