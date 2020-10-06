import { v4 as uuidv4 } from 'uuid';

import _log from 'modules/log';
import { GameBot } from 'class/GameBot';
import { BaseBot } from 'class/BaseBot';
import { Config } from 'class/Config';
import { MongoState } from 'state/MongoState';
import { CookieJar, CookieJarStorageType } from 'modules/CookieJar';
import randomString from 'modules/randomString';
import randomNumber from 'modules/randomNumber';
import sleep from 'modules/sleep';
import { Unit } from 'types/Unit';

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
        [key: string]: any;
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
                log(`task executed: ${cmdName}`);
                process.exit(0);
            } catch (error) {
                log(`error: ${error.message || error}`);
                process.exit(1);
            }
        } else {
            log(`unknown command: ${cmdName}`);
            process.exit(1);
        }
    }

    protected async loadPuppetConfig(puppetDocId: string): Promise<PuppetConfig | null> {
        const { state, log } = this;

        log(`loading puppet config id=${puppetDocId}`);

        if (!state) throw Error('no state');

        const doc = await state.mongo.collections.puppetconfigs.findOne({
            docId: puppetDocId,
        });

        if (doc) {
            this.log(`puppet config id=${puppetDocId} loaded: ${JSON.stringify(doc)}`);
        } else {
            this.log(`puppet config id=${puppetDocId} not found`);
        }

        return doc;
    }

    protected async savePuppet(puppet: Puppet): Promise<void> {
        await this.savePuppetConfig(puppet);
    }

    protected async savePuppetConfig(puppet: Puppet): Promise<void> {
        if (!this.state) throw Error('no state');

        await this.state.mongo.collections.puppetconfigs.updateOne({
            docId: puppet.config.docId,
        }, {
            $set: puppet.config,
        }, {
            upsert: true,
        });

        puppet.reporter('config saved');
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

        this.log(`new puppet config created for id=${puppetDocId}`);

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

    protected async cmd_resetAcc(): Promise<void> {
        const puppetDocId = process.argv[3];
        if (!puppetDocId) throw Error('no puppetDocId');

        const puppet = await this.createPuppet(puppetDocId);

        if (!puppet.config.gp_token) {
            throw Error('can reset only existing puppets');
        }

        const bot = puppet.gameBot;

        await bot.connectToWs();

        const currentServerId = bot.state.authData?.k;
        const farmServerId = this.config.farm.targetServerId;

        const servers = await bot.getAvailServersList();
        const myServers = servers.serverList;

        const currentServer = myServers.find((server: {[key: string]: any}) =>
            server.serverId == currentServerId);

        /*
            {
                uid: 483324400323,
                canDel: 1,
                level: 1,
                playerInfo: '{"nationalflag":114,"gender":0,"avatarurl":"headIcon_1_1","nickname":null,"headimgurl":null,"usergender":0,"username":"wy.483324400323"}',
                userName: 'wy.483324400323',
                serverId: 707
            }
        */
        for (let i = 0; i < myServers.length; ++i) {
            const server = myServers[i];

            if (server.serverId == currentServer.serverId) continue;

            await bot.deleteAccount(server.uid);
        }

        if (currentServer.serverId == farmServerId) {
            await bot.switchServerTo(this.config.farm.resetServerId);
            await bot.deleteAccount(currentServer.uid);
        }

        puppet.config.state = {};
        await this.savePuppet(puppet);

        puppet.reporter('resetted');
    }

    protected async cmd_createAndPrepareNewAcc(): Promise<void> {
        const puppetDocId = process.argv[3];
        if (!puppetDocId) throw Error('no puppetDocId');

        const puppet = await this.createPuppet(puppetDocId);

        const bot = puppet.gameBot;

        await bot.connectToWs();

        await this.saveGpToken(puppet);

        await bot.switchServerTo(puppet.config.targetServerId);

        if (bot.state.authData?.k != puppet.config.targetServerId) {
            throw Error(`puppet server id mismatch: ${bot.state.serverInfo?.serverId} != ${puppet.config.targetServerId}`);
        }

        await this.moveTutorial(puppet, 1);
        await this.moveTutorial(puppet, 2);
        await this.mergeInitialUnits(puppet);
        await this.moveTutorial(puppet, 3);
        await this.buyBaseMapArea(puppet, 805);
        await this.fightForBaseMapArea(puppet, 805, 101, [bot.getUnitsByType(10004)[0]]);
        await this.moveTutorial(puppet, 5);
        await this.moveTutorial(puppet, 6);
        await this.relocateInitialLvl4Unit(puppet);
        await this.repairInitialGoldMines(puppet);
        await this.moveTutorial(puppet, 99);

        await sleep(3000);
    }

    protected async repairInitialGoldMines(puppet: Puppet): Promise<void> {
        if (puppet.config.state['repairInitialGoldMines']) return;

        const bot = puppet.gameBot;

        const goldMinesLvl1 = bot.getBuildingsByType(1701);

        if (goldMinesLvl1.length != 3) {
            throw Error(`expected to have 3 broken gold mines of lvl 1, have: ${JSON.stringify(goldMinesLvl1)}`);
        }

        for (let i = 0; i < goldMinesLvl1.length; ++i) {
            await bot.repairBuilding(goldMinesLvl1[i]);
        }

        puppet.config.state['repairInitialGoldMines'] = true;
        await this.savePuppet(puppet);
    }

    protected async fightForBaseMapArea(puppet: Puppet, baseMapAreaId: number, baseMapAreaPveId: number, units: Unit[]): Promise<void> {
        if (puppet.config.state[`fightForBaseMapArea(${baseMapAreaId}, ${baseMapAreaPveId})`]) return;

        const bot = puppet.gameBot;

        const won = await bot.fightForBaseMapArea(baseMapAreaId, baseMapAreaPveId, units);

        if (!won) {
            throw Error(`lost fight for map area ${baseMapAreaId} stage ${baseMapAreaPveId}`);
        }

        puppet.config.state[`fightForBaseMapArea(${baseMapAreaId}, ${baseMapAreaPveId})`] = true;
        await this.savePuppet(puppet);
    }

    protected async buyBaseMapArea(puppet: Puppet, baseMapAreaId: number): Promise<void> {
        if (puppet.config.state[`buyBaseMapArea(${baseMapAreaId})`]) return;

        const bot = puppet.gameBot;

        await bot.buyBaseMapArea(baseMapAreaId);

        puppet.config.state[`buyBaseMapArea(${baseMapAreaId})`] = true;
        await this.savePuppet(puppet);
    }

    protected async relocateInitialLvl4Unit(puppet: Puppet): Promise<void> {
        if (puppet.config.state['relocateInitialLvl4Unit']) return;

        const bot = puppet.gameBot;

        const landUnitsLvl4 = bot.getUnitsByType(10004);

        if (landUnitsLvl4.length != 1) {
            throw Error(`expected to have 1 army unit lvl 4, have: ${JSON.stringify(landUnitsLvl4)}`);
        }

        await bot.relocateUnit(landUnitsLvl4[0], { x:13, y:23 });

        puppet.config.state['relocateInitialLvl4Unit'] = true;
        await this.savePuppet(puppet);
    }

    protected async mergeInitialUnits(puppet: Puppet): Promise<void> {
        if (puppet.config.state['mergeInitialUnits']) return;

        const bot = puppet.gameBot;

        await bot.mergeAllUnits(10001);
        await bot.mergeAllUnits(10002);
        await bot.mergeAllUnits(10003);

        puppet.config.state['mergeInitialUnits'] = true;
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
