import { v4 as uuidv4 } from 'uuid';

import _log from 'modules/log';
import { GameBot } from 'class/GameBot';
import { BaseBot } from 'class/BaseBot';
import { Config } from 'class/Config';
import { MongoState } from 'state/MongoState';
import { CookieJar, CookieJarStorageType } from 'modules/CookieJar';
import randomString from 'modules/randomString';
import randomNumber from 'modules/randomNumber';

interface FarmState {
    mongo: MongoState;
}

interface PuppetConfig {
    docId: string;
    cookieDocId: string;
    userAgent: string;
    aliSAFDataHash: string;
    targetServerId: number;
    gp_token: string;
}

interface Puppet {
    config: PuppetConfig;
    gameBot: GameBot;
    reporter: Function;
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

        await this.startCmd();

        this.state.mongo.client.close();
    }

    protected async startCmd(): Promise<void> {
        const { log } = this;

        const cmdName = process.argv[2];
        const cmdFu: undefined | Function = (this as any)[`cmd_${cmdName}`];

        if (cmdFu) {
            try {
                await cmdFu.call(this);
            } catch (error) {
                log(`error: ${error.message || error}`);
            }
        } else {
            log(`unknown command: ${cmdName}`);
        }
    }

    protected async loadPuppetConfig(docId: string): Promise<PuppetConfig | null> {
        if (!this.state) throw Error('no state');

        this.log(`loading puppet config for docId: ${docId}`);

        const doc = await this.state.mongo.collections.puppetconfigs.findOne({
            _id: docId,
        });

        if (doc) {
            this.log(`puppet config loaded: ${JSON.stringify(doc)}`);
        }

        return doc;
    }

    protected async savePuppetConfig(puppetConfig: PuppetConfig): Promise<void> {
        if (!this.state) throw Error('no state');

        await this.state.mongo.collections.puppetconfigs.updateOne({
            _id: puppetConfig.docId,
        }, {
            $set: puppetConfig,
        }, {
            upsert: true,
        });
    }

    protected createPuppetConfig(docId?: string): PuppetConfig {
        const { config } = this;

        docId = docId || uuidv4();

        const cookieDocId = uuidv4();

        const userAgent = config.browser.userAgentTemplate
            .replace(/:v1:/g, `${randomNumber(536, 537)}.${randomNumber(1, 99)}`)
            .replace(/:v2:/g, `${randomNumber(81, 85)}.${randomNumber(0, 12)}.${randomNumber(1, 5000)}.${randomNumber(1, 200)}`);

        const aliSAFDataHash = randomString(88, randomString.alpha.azAZ09_);

        const gp_token = ''; // will be created by game

        this.log('puppet config created');

        return {
            docId,
            cookieDocId,
            userAgent,
            aliSAFDataHash,
            targetServerId: config.farm.targetServerId,
            gp_token,
        };
    }

    protected async createPuppetGameBot(puppetConfig: PuppetConfig): Promise<GameBot> {
        if (!this.state) throw Error('no state');

        const { state, config } = this;

        const cookieJar = new CookieJar({
            storageType: CookieJarStorageType.MONGO_DB,
            storageConfig: {
                collection: state.mongo.collections.cookies,
                docId: puppetConfig.cookieDocId,
            },
        });

        await cookieJar.loadFromStorage();

        const { userAgent, aliSAFDataHash, gp_token } = puppetConfig;

        return new GameBot(config, {
            userAgent,
            aliSAFDataHash,
            cookieJar,
            gp_token,
            logSensitiveData: true,
        });
    }

    protected async createPuppet(docId?: string): Promise<Puppet> {
        const puppetConfig = docId &&
            await this.loadPuppetConfig(docId) ||
            this.createPuppetConfig(docId);

        const puppetGameBot = await this.createPuppetGameBot(puppetConfig);

        const puppet: Puppet = {
            config: puppetConfig,
            gameBot: puppetGameBot,
            reporter: _log.setName(`puppet:${puppetConfig.docId}`),
        };

        puppet.reporter('created');

        return puppet;
    }

    protected async cmd_createAndPrepareNewAcc(): Promise<void> {
        const docId = process.argv[3];

        const puppet = await this.createPuppet(docId);

        await this.connectToGame(puppet);

        puppet.config.gp_token = puppet.gameBot.getGpToken();
        await this.savePuppetConfig(puppet.config);
        puppet.reporter(`gp_token: ${puppet.config.gp_token}`);

        await this.switchServer(puppet);
    }

    protected async connectToGame(puppet: Puppet): Promise<void> {
        puppet.reporter('connectToGame');

        await puppet.gameBot.connectToWs();
    }

    protected async switchServer(puppet: Puppet): Promise<void> {
        puppet.reporter('switchServer', puppet.config.targetServerId);

        await puppet.gameBot.switchServerTo(puppet.config.targetServerId);
    }
}
