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
    state: {
        tutorialStep?: number;
        areInitialUnitsMerged?: true;
    };
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

    protected async loadPuppetConfig(puppetDocId: string): Promise<PuppetConfig | null> {
        if (!this.state) throw Error('no state');

        this.log(`loading puppet config for docId: ${puppetDocId}`);

        const doc = await this.state.mongo.collections.puppetconfigs.findOne({
            docId: puppetDocId,
        });

        if (doc) {
            this.log(`puppet config loaded: ${JSON.stringify(doc)}`);
        }

        return doc;
    }

    protected async savePuppet(puppet: Puppet): Promise<void> {
        await this.savePuppetConfig(puppet.config);
    }

    protected async savePuppetConfig(puppetConfig: PuppetConfig): Promise<void> {
        if (!this.state) throw Error('no state');

        await this.state.mongo.collections.puppetconfigs.updateOne({
            docId: puppetConfig.docId,
        }, {
            $set: puppetConfig,
        }, {
            upsert: true,
        });
    }

    protected createPuppetConfig(puppetDocId?: string): PuppetConfig {
        const { config } = this;

        puppetDocId = puppetDocId || uuidv4();

        const cookieDocId = uuidv4();

        const userAgent = config.browser.userAgentTemplate
            .replace(/:v1:/g, `${randomNumber(536, 537)}.${randomNumber(1, 99)}`)
            .replace(/:v2:/g, `${randomNumber(81, 85)}.${randomNumber(0, 12)}.${randomNumber(1, 5000)}.${randomNumber(1, 200)}`);

        const aliSAFDataHash = randomString(88, randomString.alpha.azAZ09_);

        const gp_token = ''; // will be created by game

        this.log('puppet config created');

        return {
            docId: puppetDocId,
            cookieDocId,
            userAgent,
            aliSAFDataHash,
            targetServerId: config.farm.targetServerId,
            gp_token,
            state: {},
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

        const gameBot = new GameBot(config, {
            userAgent,
            aliSAFDataHash,
            cookieJar,
            gp_token,
            logSensitiveData: true,
        });

        const gameBotLog = _log.setName(`Farm:puppet:${puppetConfig.docId}:GameBot`);
        gameBot.reporter = (msg: string) => gameBotLog(msg);

        return gameBot;
    }

    protected async createPuppet(puppetDocId?: string): Promise<Puppet> {
        const puppetConfig = puppetDocId &&
            await this.loadPuppetConfig(puppetDocId) ||
            this.createPuppetConfig(puppetDocId);

        const puppetGameBot = await this.createPuppetGameBot(puppetConfig);

        const puppet: Puppet = {
            config: puppetConfig,
            gameBot: puppetGameBot,
            reporter: _log.setName(`Farm:puppet:${puppetConfig.docId}`),
        };

        puppet.reporter('created');

        return puppet;
    }

    protected async cmd_createAndPrepareNewAcc(): Promise<void> {
        const puppetDocId = process.argv[3];

        const puppet = await this.createPuppet(puppetDocId);

        const bot = puppet.gameBot;

        await bot.connectToWs();

        await this.saveGpToken(puppet);

        await bot.switchServerTo(puppet.config.targetServerId);

        if (bot.state.serverInfo?.serverId != puppet.config.targetServerId) {
            throw Error(`puppet server id mismatch: ${bot.state.serverInfo?.serverId} != ${puppet.config.targetServerId}`);
        }

        await this.moveTutorial(puppet, 1);
        await this.moveTutorial(puppet, 2);

        await this.mergeAndRelocateInitialUnits(puppet);
    }

    protected async mergeAndRelocateInitialUnits(puppet: Puppet): Promise<void> {
        if (puppet.config.state.areInitialUnitsMerged) return;

        if (!await puppet.gameBot.mergeAllUnits(10001)) throw Error(`no 10001 units were merged`);
        if (!await puppet.gameBot.mergeAllUnits(10002)) throw Error(`no 10002 units were merged`);
        if (!await puppet.gameBot.mergeAllUnits(10003)) throw Error(`no 10003 units were merged`);

        puppet.config.state.areInitialUnitsMerged = true;

        await this.savePuppet(puppet);
    }

    protected async moveTutorial(puppet: Puppet, step: number): Promise<void> {
        const currentStep = Number(puppet.config.state.tutorialStep) || 0;

        if (currentStep < step) {
            await puppet.gameBot.moveTutorial({ step });

            puppet.config.state.tutorialStep = step;

            await this.savePuppet(puppet);
        }
    }

    protected async saveGpToken(puppet: Puppet): Promise<void> {
        puppet.config.gp_token = puppet.gameBot.getGpToken();

        puppet.reporter(`gp token: ${puppet.config.gp_token}`);

        await this.savePuppet(puppet);
    }
}
