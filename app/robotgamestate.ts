import * as wire from './wire';
import RobotProxy from './robotproxy';

export class RobotGameState implements wire.RobotState {
  constructor(public name: wire.RobotId, public proxy: RobotProxy,
              public health: number, public energy: number,
              public location: wire.Point) {
  }

  inRange(location: wire.Point, range: number) {

  }

}

export default RobotGameState;
