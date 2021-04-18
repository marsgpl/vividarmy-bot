import http from 'http';

import { BaseBot } from './BaseBot';
import { Config } from './Config';

export interface WebState {
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
        const server = http.createServer((req, res) => {
            //
        });

        server.listen(this.config.web.listen.port, this.config.web.listen.host);
    }
}
