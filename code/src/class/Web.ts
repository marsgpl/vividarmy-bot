import { BaseBot } from './BaseBot';
import { Config } from './Config';

interface WebState {
}

export class Web extends BaseBot {
    protected _state?: WebState;

    public get state(): WebState {
        if (!this._state) throw Error('Web: no state');
        return this._state;
    }

    constructor(config: Config) {
        super('Web', config);
    }

    public async start(): Promise<void> {
        //
    }
}
