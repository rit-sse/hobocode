import * as wire from './wire';

export class RobotProxy {
    private worker: Worker;
    private seq = 0;
    private resolvers: {[index: number]: {resolve: (a: any) => void, reject: (e: any) => void}} = {};

    constructor(robots: wire.RobotData[], code: string, grideSize: wire.Point) {
        this.worker = new Worker('./robot-api.js');
        this.worker.onmessage = (event) => this.onmessage(event.data);
        this.send('setup', {robots, code, grideSize}); // We dont wait for a response to setup
    }

    private onmessage(data: wire.WireMessage) {
        if (data.sequence && this.resolvers[data.sequence]) {
            this.resolvers[data.sequence].resolve(data.arguments);
            delete this.resolvers[data.sequence];
        }
    }

    private send(type: 'state',  data: wire.StateMessageArguments): Promise<wire.ActionMessage>;
    private send(type: 'setup',  data: wire.SetupArguments): Promise<wire.WireMessageArguments>;
    private send(type: string, data: {}): void; // This bogus overload is here to fool TS - overloads are hard
    private send(type: string, data: wire.WireMessageArguments): Promise<wire.WireMessageArguments> {
        this.seq++;
        const message: wire.WireMessageBase = {sequence: this.seq, type, arguments: data};
        this.worker.postMessage(message);
        let resolve: () => void, reject: () => void;
        const prom = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        this.resolvers[this.seq] = {resolve, reject};
        return prom;
    }
}

export default RobotProxy;