import * as wire from './wire';
import RobotProxy from './robotproxy';

export class GameObject {
    constructor(public location: wire.Point) {}
    inRange(other: {location: wire.Point}, range: number) {
    // check our location to another objects location
    return Math.round(Math.sqrt(
                Math.pow((this.location.x - other.location.x), 2) +
                Math.pow((this.location.y - other.location.y), 2)
           )) <= range;
    }
}

export class RobotGameObject extends GameObject implements wire.RobotState {
    public proxy: RobotProxy;
    constructor(public name: wire.RobotId, private code: string,
              public health: number, public energy: number,
              public location: wire.Point) {
        super(location);
    }

    setupProxy(robots: wire.RobotData[], gridSize: wire.Point) {
        this.proxy = new RobotProxy(robots, this.code, gridSize);
    }
}

export class RegenGameObject extends GameObject {
  constructor(public value: number, public location: wire.Point) {
      super(location);
  }
}


