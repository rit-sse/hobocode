/// <reference path='../../node_modules/typescript/lib/lib.webworker.d.ts' />

import * as wire from '../wire';

class Robot {
    private gridSize: wire.Point;
    private robots: wire.RobotData[];

    private health: number;
    private energy: number;
    private location: wire.Point;
    private tickInfo: wire.TickData[];

    private inView: wire.ViewData;
    private wereInView: wire.ViewData[];
    private botsWereInView: wire.RobotData[];
    private regensWereInView: wire.RegenData[];

    private observations: wire.Observation[];
    private detailedObservations: wire.Observation[];

    private actionResults: wire.ActionResult[];

    private moves: wire.ActionMessage[];

    private sequence: number;

    private bot: () => void;

    constructor(private worker: WorkerGlobalScope) {
        this.worker.onmessage = (event) => this.onMessage(event.data);
    }

    onMessage(message: wire.WireMessage) {
            if (message.type === 'setup') {
               this.setup(message.arguments as wire.SetupArguments);
            } else if (message.type === 'state') {
               this.sequence = message.sequence;
               this.newTick(message.arguments as wire.StateMessageArguments);
            }
    }

    setup(setupArgs: wire.SetupArguments) {
        this.gridSize = setupArgs.gridSize;
        this.robots = setupArgs.robots;
        this.bot = eval(`function() { ${setupArgs.code} } `).bind(this);
    }

    newTick(state: wire.StateMessageArguments) {
        const currentState = state.robot_state;
        this.health = currentState.health;
        this.energy = currentState.energy;
        this.location = currentState.location;

        this.tickInfo = state.tick_info;

        this.inView = this.tickInfo[this.tickInfo.length - 1].in_view;
        this.wereInView = this.tickInfo.reduce(function(list, viewData) {
            return list.concat(viewData.in_view);
        }, []);

        this.botsWereInView = this.wereInView.reduce(function(list, move) {
            return list.concat(move.robots);
        }, []);

        this.regensWereInView = this.wereInView.reduce(function(list, move) {
            return list.concat(move.regens);
        }, []);

        this.observations = this.tickInfo.reduce(function(list, data) {
            return list.concat(data.observations);
        }, []);

        this.detailedObservations = this.tickInfo.reduce(function(list, data) {
            // JS is silly.
            list.push(data.observations);
            return list;
        }, []);

        this.actionResults = this.tickInfo.reduce(function(list, data) {
            return list.concat(data.action_result);
        }, []);

        this.bot();
    }

    move(direction: string) {
        const move = {command: 'move', arguments: {direction: wire.CardinalDirection[direction] as wire.CardinalDirection }} as wire.MoveActionMessage;
        this.moves.push(move);

        return wire.Costs.moves.move;
    }

    shield() {
        const shield = {command: 'shield'} as wire.ShieldActionMessage;
        this.moves.push(shield);

        return wire.Costs.moves.shield;
    }

    hold() {
        const hold = {command: 'hold'} as wire.HoldActionMessage;
        this.moves.push(hold);
    }

    shoot(radius: number, location: wire.Point) {
        const shoot = {command: 'shoot', arguments: {location, radius}} as wire.ShootActionMessage;
        this.moves.push(shoot);

        return wire.Costs.moves.shoot[radius];
    }

    scan() {
        const scan = {command: 'scan'} as wire.ScanActionMessage;
        this.moves.push(scan);

        return wire.Costs.moves.scan;
    }

    finalizeMoves() {
        const message = {type: 'action', sequence: this.sequence, arguments: this.moves} as wire.ActionEnvelopeMessage;

        this.worker.postMessage(message);

        // Reset moves
        this.moves = [];
    }

    getActionResults() { return this.actionResults; }

    getObsesrvations() { return this.observations; }

    getDetailedObservations() { return this.detailedObservations; }

    getRobotsInView() { return this.inView.robots; }

    getRobotsWereInView() { return this.botsWereInView; }

    getRegensInView() { return this.inView.regens; }

    getRegensWereInView() { return this.regensWereInView; }

    getTickInfo() { return this.tickInfo; }

    getHealth() { return this.health; }

    getEnergy() { return this.energy; }

    getLocation() { return this.location; }

    getGridSize() { return this.gridSize; }

}

new Robot(this);
