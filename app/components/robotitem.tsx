import React, {Component} from 'react';
import {FlatButton, CheckBox, Paper} from 'material-ui';

export class RobotItem<P, S> extends Component<P, S> {
	constructor(props) {
		super(props);
	}

	render(){
		return <Paper>
			<CheckBox />
			<h4>{this.props.robot.name}</h4>
			<FlatButton>Edit</FlatButton>
		</Paper>;
	}
}

export default RobotItem;
