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
import { MyServer } from 'types/MyServer';
import asyncForeach from 'modules/asyncForeach';

const js = JSON.stringify;

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
            this.log(`puppet config id=${puppetDocId} loaded: ${js(doc)}`);
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

    protected async cmd_exp(): Promise<void> {
        const puppet = await this.createPuppet('exp');

        const bot = puppet.gameBot;

        await bot.connectToWs();
        await this.saveGpToken(puppet);
        await bot.switchServerTo(642);
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

        const currentServerId = bot.state.serverInfo?.serverId;
        const farmServerId = this.config.farm.targetServerId;
        const resetServerId = this.config.farm.resetServerId;

        const servers = await bot.getAvailServersList();
        const myServers: MyServer[] = servers.serverList;

        const currentServer = myServers.find(s => s.serverId == currentServerId);

        if (currentServerId != farmServerId) {
            puppet.reporter(`not on a farm server: current=${currentServerId} farm=${farmServerId}`);
            puppet.reporter(`deleting all accs except current and we are done`);

            await asyncForeach(myServers, async server => {
                if (server.serverId == currentServerId) return;
                await bot.deleteAccount(server.uid);
            });
        } else {
            puppet.reporter(`on a farm server: current=${currentServerId} farm=${farmServerId}`);

            if (myServers.length < 2) {
                puppet.reporter(`has only farm acc. creating acc on a reset server, switching there and then deleting farm acc`);

                await bot.switchServerTo(resetServerId);

                await asyncForeach(myServers, async server => {
                    if (server.serverId == resetServerId) return;
                    await bot.deleteAccount(server.uid);
                });
            } else {
                puppet.reporter(`has 2+ accs. switching to any non-farm acc and then delete all accs except currently switched`);

                const altServer = myServers.find(s => s.serverId != farmServerId);
                if (!altServer) throw Error(`no altServer`);
                await bot.switchServerTo(altServer.serverId);

                await asyncForeach(myServers, async server => {
                    if (server.serverId == altServer.serverId) return;
                    await bot.deleteAccount(server.uid);
                });
            }
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
        await this.moveTutorial(puppet, 1);
        await this.moveTutorial(puppet, 2);
        await this.mergeInitialUnits(puppet);
        await this.moveTutorial(puppet, 3);
        await this.buyBaseMapArea(puppet, 805);
        await this.fightForBaseMapArea(puppet, 805, 101, [
            bot.getUnitsByType(10004)[0],
        ]);
        await this.moveTutorial(puppet, 5);
        await this.moveTutorial(puppet, 6);
        await this.relocateInitialLvl4Unit(puppet);
        await this.repairInitialGoldMines(puppet);
        await this.moveTutorial(puppet, 99);
        await this.build5goldMinesLvl1(puppet);
        await this.startRepairingOldTank(puppet);
        await this.mergeInitialGoldMines(puppet);
        await this.relocateInitialLvl4GoldMine(puppet);
        await this.build3barracksLvl1(puppet);
        await this.mergeInitialBarracks(puppet);
        await this.relocateInitialLvl3Barracks(puppet);
        await this.order6unitsLvl3(puppet);
        await this.mergeInitialUnits2(puppet);
        await this.relocateLvl5Units(puppet);
        await this.buyBaseMapArea(puppet, 705);
        await this.fightForBaseMapArea(puppet, 705, 201, [
            bot.getUnitsByType(10005)[0],
        ]);
        await this.fightForBaseMapArea(puppet, 705, 202, [
            bot.getUnitsByType(10005)[0],
            bot.getUnitsByType(10005)[1],
        ]);
        await this.fightForBaseMapArea(puppet, 705, 203, [
            bot.getUnitsByType(10005)[0],
            bot.getUnitsByType(10005)[1],
        ]);

        await sleep(3000);
    }

    protected async startRepairingOldTank(puppet: Puppet): Promise<void> {
        if (puppet.config.state['startRepairingOldTank']) return;
        const bot = puppet.gameBot;

        const readinessTimestamp = await bot.startRepairingOldTank();

        puppet.config.state['startRepairingOldTank'] = readinessTimestamp;
        await this.savePuppet(puppet);
    }

    protected async order6unitsLvl3(puppet: Puppet): Promise<void> {
        if (puppet.config.state['order6unitsLvl3']) return;
        const bot = puppet.gameBot;

        const barracksLvl3 = bot.getBuildingsByType(1043).pop();
        if (!barracksLvl3) throw Error('no barracksLvl3');

        await sleep(await bot.orderUnit(barracksLvl3, { x:23, y:23 }) * 1000);
        await sleep(await bot.orderUnit(barracksLvl3, { x:22, y:24 }) * 1000);
        await sleep(await bot.orderUnit(barracksLvl3, { x:22, y:26 }) * 1000);
        await sleep(await bot.orderUnit(barracksLvl3, { x:22, y:22 }) * 1000);
        await sleep(await bot.orderUnit(barracksLvl3, { x:20, y:24 }) * 1000);
        await sleep(await bot.orderUnit(barracksLvl3, { x:21, y:23 }) * 1000);

        await sleep(3000);

        if (bot.getUnitsByType(10003).length != 6) {
            throw Error(`expected 6 units of type 10003`);
        }

        puppet.config.state['order6unitsLvl3'] = true;
        await this.savePuppet(puppet);
    }

    protected async relocateInitialLvl3Barracks(puppet: Puppet): Promise<void> {
        if (puppet.config.state['relocateInitialLvl3Barracks']) return;
        const bot = puppet.gameBot;

        const barracksLvl3 = bot.getBuildingsByType(1043);

        if (barracksLvl3.length != 1) {
            throw Error(`expected to have 1 barracks lvl 3, have: ${js(barracksLvl3)}`);
        }

        await bot.relocateBuilding(barracksLvl3[0], { x:24, y:24 });

        puppet.config.state['relocateInitialLvl3Barracks'] = true;
        await this.savePuppet(puppet);
    }

    protected async relocateInitialLvl4GoldMine(puppet: Puppet): Promise<void> {
        if (puppet.config.state['relocateInitialLvl4GoldMine']) return;
        const bot = puppet.gameBot;

        const goldMinesLvl4 = bot.getBuildingsByType(1704);

        if (goldMinesLvl4.length != 1) {
            throw Error(`expected to have 1 gold mine lvl 4, have: ${js(goldMinesLvl4)}`);
        }

        await bot.relocateBuilding(goldMinesLvl4[0], { x:26, y:22 });

        puppet.config.state['relocateInitialLvl4GoldMine'] = true;
        await this.savePuppet(puppet);
    }

    protected async mergeInitialBarracks(puppet: Puppet): Promise<void> {
        if (puppet.config.state['mergeInitialBarracks']) return;
        const bot = puppet.gameBot;

        await bot.mergeAllBuildings(1041);
        await bot.mergeAllBuildings(1042);

        await sleep(3000);

        if (bot.getBuildingsByType(1043).length != 1) {
            throw Error(`expected 1 building of type 1043`);
        }

        puppet.config.state['mergeInitialBarracks'] = true;
        await this.savePuppet(puppet);
    }

    protected async mergeInitialGoldMines(puppet: Puppet): Promise<void> {
        if (puppet.config.state['mergeInitialGoldMines']) return;
        const bot = puppet.gameBot;

        await bot.mergeAllBuildings(1701);
        await bot.mergeAllBuildings(1702);
        await bot.mergeAllBuildings(1703);

        await sleep(3000);

        if (bot.getBuildingsByType(1704).length != 1) {
            throw Error(`expected 1 building of type 1704`);
        }

        puppet.config.state['mergeInitialGoldMines'] = true;
        await this.savePuppet(puppet);
    }

    protected async build3barracksLvl1(puppet: Puppet): Promise<void> {
        if (puppet.config.state['build3barracksLvl1']) return;
        const bot = puppet.gameBot;

        await bot.build(1041, { x:18, y:26 });
        await bot.build(1041, { x:20, y:24 });
        await bot.build(1041, { x:22, y:26 });

        await sleep(3000);

        if (bot.getBuildingsByType(1041).length != 4) {
            throw Error(`expected 4 buildings of type 1041`);
        }

        puppet.config.state['build3barracksLvl1'] = true;
        await this.savePuppet(puppet);
    }

    protected async build5goldMinesLvl1(puppet: Puppet): Promise<void> {
        if (puppet.config.state['build5goldMinesLvl1']) return;
        const bot = puppet.gameBot;

        await bot.build(1701, { x:18, y:26 });
        await bot.build(1701, { x:20, y:24 });
        await bot.build(1701, { x:22, y:26 });
        await bot.build(1701, { x:24, y:24 });
        await bot.build(1701, { x:26, y:22 });

        await sleep(3000);

        if (bot.getBuildingsByType(1701).length != 8) {
            throw Error(`expected 8 buildings of type 1701`);
        }

        puppet.config.state['build5goldMinesLvl1'] = true;
        await this.savePuppet(puppet);
    }

    protected async repairInitialGoldMines(puppet: Puppet): Promise<void> {
        if (puppet.config.state['repairInitialGoldMines']) return;
        const bot = puppet.gameBot;

        const goldMinesLvl1 = bot.getBuildingsByType(1701);

        if (goldMinesLvl1.length != 3) {
            throw Error(`expected to have 3 broken gold mines of lvl 1, have: ${js(goldMinesLvl1)}`);
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

    protected async relocateLvl5Units(puppet: Puppet): Promise<void> {
        if (puppet.config.state['relocateLvl5Units']) return;
        const bot = puppet.gameBot;

        const landUnitsLvl5 = bot.getUnitsByType(10005);

        if (landUnitsLvl5.length != 2) {
            throw Error(`expected to have 2 army unit lvl 5, have: ${js(landUnitsLvl5)}`);
        }

        await bot.relocateUnit(landUnitsLvl5[0], { x:13, y:23 });
        await bot.relocateUnit(landUnitsLvl5[1], { x:14, y:24 });

        puppet.config.state['relocateLvl5Units'] = true;
        await this.savePuppet(puppet);
    }

    protected async relocateInitialLvl4Unit(puppet: Puppet): Promise<void> {
        if (puppet.config.state['relocateInitialLvl4Unit']) return;
        const bot = puppet.gameBot;

        const landUnitsLvl4 = bot.getUnitsByType(10004);

        if (landUnitsLvl4.length != 1) {
            throw Error(`expected to have 1 army unit lvl 4, have: ${js(landUnitsLvl4)}`);
        }

        await bot.relocateUnit(landUnitsLvl4[0], { x:13, y:23 });

        puppet.config.state['relocateInitialLvl4Unit'] = true;
        await this.savePuppet(puppet);
    }

    protected async mergeInitialUnits2(puppet: Puppet): Promise<void> {
        if (puppet.config.state['mergeInitialUnits2']) return;
        const bot = puppet.gameBot;

        await bot.mergeAllUnits(10003);
        await bot.mergeAllUnits(10004);

        await sleep(3000);

        if (bot.getUnitsByType(10005).length != 2) {
            throw Error(`expected 2 units of type 10005`);
        }

        puppet.config.state['mergeInitialUnits2'] = true;
        await this.savePuppet(puppet);
    }

    protected async mergeInitialUnits(puppet: Puppet): Promise<void> {
        if (puppet.config.state['mergeInitialUnits']) return;
        const bot = puppet.gameBot;

        await bot.mergeAllUnits(10001);
        await bot.mergeAllUnits(10002);
        await bot.mergeAllUnits(10003);

        await sleep(3000);

        if (bot.getUnitsByType(10004).length != 1) {
            throw Error(`expected 1 unit of type 10004`);
        }

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
        puppet.reporter(`saving gp token: ${puppet.config.gp_token}`);
        await this.savePuppet(puppet);
    }
}
