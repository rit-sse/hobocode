import * as wire from './wire';
import RobotProxy from './robotproxy';

export class GameObject {
    constructor(public location: wire.Point) {}
    inRange(other_location: wire.Point, range: number) {
    // check our location to another objects location
    return  Math.round(Math.sqrt(
                Math.pow((location.x - other_location.x), 2) +
                Math.pow((location.y - other_location.y), 2)
            ));
    }
}

export class RobotGameObject extends GameObject implements wire.RobotState {
    constructor(public name: wire.RobotId, public proxy: RobotProxy,
              public health: number, public energy: number,
              public location: wire.Point) {
        super(location);
    }
}

export class RegenGameObject extends GameObject {
  constructor(public value: number, public location: wire.Point) {
      super(location);
  }
}

export class ExplosionGameObject {
  constructor(public origin: wire.Point, public range: wire.Point) {
  }
}

export class ShieldGameObject extends GameObject {
  constructor(public location: wire.Point) {
      super(location);
  }
}
