import * as wire from './wire';
import RobotProxy from './robotproxy';
import {GameState} from './gamestate';

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
    public shielded: boolean = false;
    constructor(public name: wire.RobotId, private code: string,
              public health: number, public energy: number,
              public location: wire.Point) {
        super(location);
    }

    setupProxy(robots: wire.RobotData[], gridSize: wire.Point) {
        this.proxy = new RobotProxy(robots, this.code, gridSize);
    }

    private observations: wire.Observation[] = [];
    addObservation(observation: wire.Observation) {
        this.observations.push(observation);
    }

    private result: wire.ActionResult;
    setResult(result: wire.ActionResult) {
        this.result = result;
    }

    private ticks: wire.TickData[] = [];
    generateTickDataAndReset(board: GameState) {
        const ret: wire.TickData = {
            in_view: {
                robots: board.entities.robots.filter(bot => this.inRange(bot, wire.ViewDistance)).map(bot => ({location: bot.location, name: bot.name})),
                regens: board.entities.regens.filter(reg => this.inRange(reg, wire.ViewDistance)).map(reg => ({location: reg.location, value: reg.value})),
            },
            observations: this.observations,
            action_result: this.result,
        };
        this.observations = [];
        this.result = undefined;
        this.ticks.push(ret);
    }

    getTurnResultsAndReset(): wire.TickData[] {
        const ret = this.ticks;
        this.ticks = [];
        return ret;
    }
}

export class RegenGameObject extends GameObject {
  constructor(public value: number, public location: wire.Point) {
      super(location);
  }
}


