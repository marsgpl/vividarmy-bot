import { GameBot } from 'class/GameBot';
import { BaseBot } from 'class/BaseBot';
import { Config } from 'class/Config';
import { MongoState } from 'state/MongoState';
import { CookieJar, CookieJarStorageType } from 'modules/CookieJar';

interface FarmState {
    mongo: MongoState;
}

export class Farm extends BaseBot {
    protected state?: FarmState;

    constructor(config: Config) {
        super('Farm', config);
    }

    public async start(): Promise<void> {
        const mongoState = await this.connectToMongo();

        this.state = {
            mongo: mongoState,
        };

        this.startCmd();
    }

    protected async startCmd(): Promise<void> {
        const { log } = this;

        const cmdName = process.env.VIVIDARMY_BOT_FARM_CMD;
        const cmdFu: undefined | Function = (this as any)[`cmd_${cmdName}`];

        if (cmdFu) {
            try {
                await cmdFu.call(this);
            } catch (error) {
                return log(`error: ${error.message || error}`);
            }
        } else {
            return log(`unknown command: ${cmdName}`);
        }
    }

    // protected async cmd_createLvl10(): Promise<string> {
    // }
}
