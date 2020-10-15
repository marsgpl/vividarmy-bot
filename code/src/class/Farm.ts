import { MongoState } from 'state/MongoState';
import { BaseBot } from './BaseBot';
import { Config } from './Config';
import { Puppet } from './Puppet';

export interface FarmState {
    mongo: MongoState;
}

export type FarmCommand = (this: Farm) => Promise<void>;

export type FarmCommandsCache = {
    [commandName: string]: FarmCommand;
};

export class Farm extends BaseBot {
    protected _state?: FarmState;
    protected commandsCache: FarmCommandsCache = {};

    public get state(): FarmState {
        if (!this._state) throw Error('Farm: no state');
        return this._state;
    }

    constructor(config: Config) {
        super('Farm', config);
    }

    public async start(): Promise<void> {
        const { log } = this;

        const mongoState = await this.connectToMongo();

        this._state = {
            mongo: mongoState,
        };

        const commandName = process.argv[2];

        if (!commandName) {
            throw Error(`unable to get command name from args`);
        }

        const command = this.getCommandByName(commandName);

        if (!command) {
            throw Error(`unknown command: ${commandName}`);
        }

        try {
            await command.call(this);
            log(`command succeed: ${commandName}`);
            process.exit(0);
        } catch (error) {
            log(`command failed: ${commandName}`);
            throw error;
        }
    }

    public getCommandByName(commandName: string): FarmCommand | undefined {
        if (commandName.length === 0) return;

        const commandFromCache = this.commandsCache[commandName];

        if (commandFromCache) {
            return commandFromCache;
        }

        try {
            commandName = commandName.replace(/[^a-z0-9_-]/ig, '');
            const command = require(`farmCommands/${commandName}`);
            this.commandsCache[commandName] = command.default;
        } catch (error) {
            this.log(`command ${commandName} not found: ${error}`);
        }

        return this.commandsCache[commandName];
    }

    public async getPuppetById(puppetId: string): Promise<Puppet> {
        if (!puppetId) throw Error('no puppetId');

        const puppet = new Puppet(this.config, {
            puppetId,
            mongo: this.state.mongo,
        });

        await puppet.init();

        return puppet;
    }
}
