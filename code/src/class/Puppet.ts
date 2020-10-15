import { MongoState } from 'state/MongoState';
import { Config } from './Config';
import _log from 'modules/log';
import { GameBot } from './GameBot';
import randomString from 'modules/randomString';
import randomNumber from 'modules/randomNumber';
import asyncForeach from 'modules/asyncForeach';
import sleep from 'modules/sleep';
import mergeUnits from 'gameCommands/mergeUnits';
import { Unit } from 'gameTypes/Unit';
import { Building } from 'gameTypes/Building';
import repairBuilding from 'gameCommands/repairBuilding';
import relocateUnit from 'gameCommands/relocateUnit';
import build from 'gameCommands/build';
import researchScience from 'gameCommands/researchScience';

const js = JSON.stringify;

type Done = { done: boolean };

interface PuppetOptions {
    puppetId: string;
    mongo: MongoState;
}

interface PuppetState {
    targetServerId: number;
    gpToken: string;
    userAgent: string;
    aliSAFDataHash: string;
    aliSAFDataDetail: string;
    switch: {
        [key: string]: any;
    };
}

export class Puppet {
    protected log: Function;
    protected _state?: PuppetState;
    protected _gameBot?: GameBot;

    public get state(): PuppetState {
        if (!this._state) throw Error('Puppet: no state');
        return this._state;
    }

    public get gameBot(): GameBot {
        if (!this._gameBot) throw Error('Puppet: no gameBot');
        return this._gameBot;
    }

    constructor(
        protected config: Config,
        protected options: PuppetOptions,
    ) {
        this.log = _log.setName(`Puppet#${options.puppetId}`);
    }

    public async saveGpToken(): Promise<void> {
        this.state.gpToken = this.gameBot.getGpToken();
        if (!this.state.gpToken) throw Error('no gpToken');
        this.log(`saving gp_token=${this.state.gpToken}`);
        await this.saveState();
    }

    public async init(): Promise<void> {
        const { log } = this;

        const state = await this.loadState();

        if (state) {
            this._state = state;
        } else {
            this._state = this.createState();
            await this.saveState();
        }

        this._gameBot = new GameBot(this.config, {
            gpToken: String(this.state.gpToken || ''),
            cookieDocId: `puppet:${this.options.puppetId}`,
            cookieCollection: this.options.mongo.collections.cookies,
            userAgent: this.state.userAgent,
            aliSAFDataHash: this.state.aliSAFDataHash,
            aliSAFDataDetail: this.state.aliSAFDataDetail,
        });

        this.gameBot.reporter = (text: string): void => {
            log('GameBot:', text);
        };

        await this.gameBot.init();

        log(`game bot created: gp_token=${this.gameBot.getGpToken()}`);
    }

    protected async saveState(): Promise<void> {
        const r = await this.options.mongo.collections.puppets.updateOne({
            _id: this.options.puppetId,
        }, {
            $set: this.state,
        }, {
            upsert: true,
        });

        if (!r?.result?.ok) {
            throw Error(`failed to save state: ${r}`);
        }

        this.log('state saved');
    }

    protected createState(): PuppetState {
        const state: PuppetState = {
            targetServerId: this.config.farm.targetServerId,
            gpToken: '',
            userAgent: this.generateUserAgent(),
            aliSAFDataHash: randomString(88, randomString.alpha.azAZ09_),
            aliSAFDataDetail: '',
            switch: {},
        };

        this.log('new state created');

        return state;
    }

    protected generateUserAgent(): string {
        const userAgent = this.config.browser.userAgentTemplate
            .replace(/:v1:/g, `${randomNumber(536, 537)}.${randomNumber(1, 99)}`)
            .replace(/:v2:/g, `${randomNumber(81, 85)}.${randomNumber(0, 12)}.${randomNumber(1, 5000)}.${randomNumber(1, 200)}`);

        this.log(`userAgent created: ${userAgent}`);

        return userAgent;
    }

    protected async loadState(): Promise<PuppetState | null> {
        const r = await this.options.mongo.collections.puppets.findOne({
            _id: this.options.puppetId,
        });

        if (!r?.targetServerId) {
            return null;
        }

        this.log(`state loaded`);

        r.switch = r.switch || {};

        return r as PuppetState;
    }

    protected can(key: string): boolean {
        if (this.state.switch[key]) return false;
        return true;
    }

    protected cant(): Done {
        return { done: false };
    }

    protected async done(key: string, value: any = true): Promise<Done> {
        this.log(`done: ${key}`);
        this.state.switch[key] = value;
        await this.saveState();
        return { done: true };
    }

    // {"c":1652,"o":"18","p":{"type":1}}
    // {"c":1652,"s":0,"d":"{\"stat\":1}","o":"18"}
    // {"c":1652,"o":"557","p":{"type":2}}
    // {"c":1652,"s":0,"d":"{\"stat\":2,\"endTime\":1601748262}","o":"557"}
    public async doAncientTank(tankStage: number): Promise<Done> {
        const key = `doAncientTank:${tankStage}`;
        if (!this.can(key)) return this.cant();

        const r = await this.gameBot.wsRPC(1652, { type: Number(tankStage) });
        if (r?.stat !== tankStage) throw Error(`fail: ${js(r)}`);

        r.endTime && await this.done('doAncientTank:endTime', r.endTime);

        return this.done(key);
    }

    // {"c":814,"o":"108","p":{"text":"1"}}
    // {"c":814,"s":0,"d":"{\"text\":\"1\"}","o":"108"}
    public async moveTutorial(tutorialStage: number): Promise<Done> {
        const key = `moveTutorial:${tutorialStage}`;
        if (!this.can(key)) return this.cant();

        const r = await this.gameBot.wsRPC(814, { text: String(tutorialStage) });
        if (r?.text !== String(tutorialStage)) throw Error(`fail: ${js(r)}`);

        return this.done(key);
    }

    public async mergeUnitsWhilePossible(keySuffix: string): Promise<Done> {
        const key = `mergeUnitsWhilePossible:${keySuffix}`;
        if (!this.can(key)) return this.cant();

        let mergedOverall = 0;

        while (true) {
            let merged = 0;

            const groups = await this.gameBot.getMergeableUnitsGroups();

            await asyncForeach<string>(Object.keys(groups), async unitTypeId => {
                const units = groups[unitTypeId];

                for (let i = 0; i < units.length - 1; i += 2) {
                    const unit1 = units[i];
                    const unit2 = units[i + 1];

                    // now kiss
                    const r = await mergeUnits(this.gameBot, {
                        delId: unit1.id,
                        targetId: unit2.id,
                    });

                    if (!r) break;

                    merged++;
                    mergedOverall++;
                }
            });

            if (merged === 0) break;

            // pause between merges to await for all async notifications about units delta
            await sleep(2000);
        }

        if (!mergedOverall) {
            throw Error('no units were merged');
        }

        return this.done(key);
    }

    // public async relocateInitialLvl4Unit(): Promise<Done> {
    //     const key = `relocateInitialLvl4Unit`;
    //     if (!this.can(key)) return this.cant();

    //     //
    // }

    // {"c":117,"o":"871","p":{"id":805}}
    // {"c":117,"s":0,"d":"{\"unlockArea\":1}","o":"871"}
    public async buyBaseMapArea(baseMapAreaId: number): Promise<Done> {
        const key = `buyBaseMapArea:${baseMapAreaId}`;
        if (!this.can(key)) return this.cant();

        const r = await this.gameBot.wsRPC(117, { id: Number(baseMapAreaId) });
        if (!r?.unlockArea) throw Error(`fail: ${js(r)}`);

        // @TODO apply unlockArea

        return this.done(key);

        // @TODO async
        // {"c":10708,"s":0,"d":"{\"allAreaWar\":[{\"areaId\":805,\"chapterId\":1,\"pve_node\":{\"icon\":\"boss1\",\"name\":\"104117\",\"order\":1},\"extInfos\":[{\"itsBoss\":0,\"award\":0,\"levelPoint\":1}],\"finish\":0,\"pve_level\":{\"reward\":100101,\"node\":1,\"using\":1,\"player_number\":1,\"id\":101,\"enemy_type\":0,\"enemy_config\":\"10001\",\"cost_energy\":0,\"player_type\":0,\"order\":1,\"level_count\":1},\"pveId\":101}]}","o":null}
        // {"c":10707,"s":0,"d":"{\"msgType\":0,\"nowAreaWar\":{\"areaId\":805,\"chapterId\":1,\"pve_node\":{\"icon\":\"boss1\",\"name\":\"104117\",\"order\":1},\"extInfos\":[{\"itsBoss\":0,\"award\":0,\"levelPoint\":1}],\"finish\":0,\"pve_level\":{\"reward\":100101,\"node\":1,\"using\":1,\"player_number\":1,\"id\":101,\"enemy_type\":0,\"enemy_config\":\"10001\",\"cost_energy\":0,\"player_type\":0,\"order\":1,\"level_count\":1},\"pveId\":101}}","o":null}
        // {"c":10053,"s":0,"d":"{\"unlockArea\":\"1\"}","o":null}
    }

    // {"c":420,"o":"924","p":{"pveId":101,"armyList":["1710042903487277067"],"areaId":805,"heroList":[],"trapList":[]}}
    // {"c":420,"s":0,"d":"{\"reward\":{\"resource\":{\"gold\":0.0,\"oil\":0.0,\"voucher\":0.0,\"honor\":0.0,\"metal\":0.0,\"coal\":0.0,\"wood\":0.0,\"soil\":0.0,\"military\":0.0,\"expedition_coin\":0.0,\"jungong\":0.0,\"coin\":1000.0},\"build\":[],\"armys\":[],\"hero\":[],\"exp\":0.0,\"giftExp\":0,\"items\":[],\"herosplit\":[],\"giftKey\":0,\"energy\":0},\"battle\":{\"result\":1,\"ver\":1,\"process\":[{\"val\":1.0,\"selfVal\":0.0,\"t\":4,\"tl\":0,\"source\":\"0\"},{\"val\":2.0,\"selfVal\":0.0,\"t\":1,\"tl\":0,\"source\":\"1710042903487277067\"},{\"val\":2.0,\"selfVal\":0.0,\"t\":1,\"tl\":0,\"source\":\"1\"},{\"val\":7.0,\"selfVal\":0.0,\"t\":2,\"tl\":1800,\"actType\":2,\"source\":\"1710042903487277067\",\"target\":\"1\"}],\"attacker\":{\"uid\":318483612250,\"career\":0,\"effectBuffs\":[],\"activeSkill\":[],\"traceEffectBuffs\":[],\"allStandings\":{\"wounded\":0,\"total\":1,\"survival\":1,\"dead\":0},\"players\":[{\"heroList\":[],\"uid\":318483612250,\"traps\":[],\"career\":0,\"effectBuffs\":[],\"activeSkill\":[],\"traceEffectBuffs\":[],\"allStandings\":{\"wounded\":0,\"total\":1,\"survival\":1,\"dead\":0},\"buffs\":[],\"attackPointNum\":1,\"armyEquips\":[{\"itemId\":400002,\"pos\":1,\"armyType\":101},{\"itemId\":400001,\"pos\":0,\"armyType\":101},{\"itemId\":400004,\"pos\":1,\"armyType\":201},{\"itemId\":400005,\"pos\":0,\"armyType\":301},{\"itemId\":400003,\"pos\":0,\"armyType\":201},{\"itemId\":400006,\"pos\":1,\"armyType\":301}]}],\"buffs\":[],\"units\":[{\"uid\":318483612250,\"maxShield\":0.0,\"armyId\":10004,\"maxPower\":28.0,\"uuid\":\"1710042903487277067\",\"isDead\":0,\"uuids\":[{\"uuid\":\"1710042903487277067\",\"isDead\":0}]}],\"attackPointNum\":1},\"reportComparison\":1,\"fightType\":1,\"defender\":{\"uid\":0,\"career\":0,\"effectBuffs\":[],\"activeSkill\":[],\"traceEffectBuffs\":[],\"allStandings\":{\"wounded\":0,\"total\":1,\"survival\":0,\"dead\":1},\"players\":[{\"heroList\":[],\"uid\":0,\"traps\":[],\"career\":0,\"effectBuffs\":[],\"activeSkill\":[],\"traceEffectBuffs\":[],\"allStandings\":{\"wounded\":0,\"total\":1,\"survival\":0,\"dead\":1},\"buffs\":[],\"attackPointNum\":1,\"armyEquips\":[]}],\"buffs\":[],\"units\":[{\"uid\":0,\"maxShield\":0.0,\"armyId\":10001,\"maxPower\":5.0,\"uuid\":\"1\",\"isDead\":1,\"uuids\":[{\"uuid\":\"1\",\"isDead\":1}]}],\"attackPointNum\":1}},\"energy\":30}","o":"924"}
    public async fightBaseMapArea(
        baseMapAreaId: number,
        baseMapAreaStageId: number,
        unitsToFightWith: Unit[],
    ): Promise<Done> {
        const key = `fightBaseMapArea:${baseMapAreaId}:${baseMapAreaStageId}`;
        if (!this.can(key)) return this.cant();

        // @TODO heroList
        // @TODO trapList
        const r = await this.gameBot.wsRPC(420, {
            pveId: Number(baseMapAreaStageId),
            armyList: unitsToFightWith.map(u => u.id),
            areaId: Number(baseMapAreaId),
            heroList: [],
            trapList: [],
        });

        if (!r?.reward) {
            throw Error(`fightBaseMapArea fail: ${js(r)}`);
        }

        // @TODO apply reward

        return this.done(key);

        // @TODO async
        // {"c":10104,"s":0,"d":"{\"areaId\":805}","o":null}
        // {"c":10124,"s":0,"d":"{\"treasureTasks\":[{\"num\":1.0,\"state\":0,\"taskId\":5}],\"isUpdate\":1}","o":null}
        // {"c":10708,"s":0,"d":"{\"allAreaWar\":[]}","o":null}
        // {"c":10707,"s":0,"d":"{\"msgType\":2,\"nowAreaWar\":{\"areaId\":805,\"chapterId\":1,\"pve_node\":{\"icon\":\"boss1\",\"name\":\"104117\",\"order\":1},\"extInfos\":[{\"itsBoss\":0,\"award\":0,\"levelPoint\":1}],\"finish\":1,\"pve_level\":{\"reward\":100101,\"node\":1,\"using\":1,\"player_number\":1,\"id\":101,\"enemy_type\":0,\"enemy_config\":\"10001\",\"cost_energy\":0,\"player_type\":0,\"order\":1,\"level_count\":1},\"pveId\":101}}","o":null}
        // {"c":10031,"s":0,"d":"{\"resource\":{\"gold\":0.0,\"oil\":0.0,\"voucher\":0.0,\"honor\":0.0,\"metal\":0.0,\"coal\":0.0,\"wood\":0.0,\"soil\":0.0,\"military\":0.0,\"expedition_coin\":0.0,\"jungong\":0.0,\"coin\":1000.0},\"build\":[],\"armys\":[],\"hero\":[],\"exp\":0.0,\"giftExp\":0,\"items\":[],\"herosplit\":[],\"giftKey\":0,\"energy\":0}","o":null}
    }

    public async relocateInitialLvl4Unit(): Promise<Done> {
        const key = `relocateInitialLvl4Unit`;
        if (!this.can(key)) return this.cant();

        const lvl4ArmyUnit = await this.gameBot.getUnitsByTypeId(10004);
        if (lvl4ArmyUnit.length !== 1) {
            throw Error(`expected: lvl4 army unit x1, got: x${lvl4ArmyUnit.length}`);
        }

        const r = await relocateUnit(this.gameBot, lvl4ArmyUnit[0], { x:13, y:23 });
        if (!r) {
            throw Error(`relocation failed`);
        }

        return this.done(key);
    }

    public async build5goldMinesLvl1(): Promise<Done> {
        const key = `build5goldMinesLvl1`;
        if (!this.can(key)) return this.cant();

        const bot = this.gameBot;

        if (!await build(bot, 1701, { x:18, y:26 })) throw Error(`failed to build`);
        if (!await build(bot, 1701, { x:20, y:24 })) throw Error(`failed to build`);
        if (!await build(bot, 1701, { x:22, y:26 })) throw Error(`failed to build`);

        // wait for treasure task claim apply
        await sleep(3000);

        if (!await build(bot, 1701, { x:24, y:24 })) throw Error(`failed to build`);
        if (!await build(bot, 1701, { x:26, y:22 })) throw Error(`failed to build`);

        // wait for building delta apply
        await sleep(3000);

        const goldMines = await bot.getBuildingsByTypeId(1701);

        if (goldMines.length != 8) {
            throw Error(`expected 8 buildings of type 1701, got: ${goldMines.length}`);
        }

        return this.done(key);
    }

    public async repairBuildingsByTypeId(buildingTypeId: number, note: string): Promise<Done> {
        const key = `repairBuildingByTypeId:${buildingTypeId}`;
        if (!this.can(key)) return this.cant();

        const building = await this.gameBot.getBuildingsByTypeId(buildingTypeId);
        const reparable = building.filter(b => b.broken === 1);

        if (reparable.length < 1) {
            throw Error(`repairBuildingByTypeId: ${buildingTypeId}: expected more than 1; note: ${note}`);
        }

        await asyncForeach<Building>(reparable, async building => {
            await repairBuilding(this.gameBot, { buildingId: building.id });
        });

        return this.done(key);
    }

    public async researchScienceById(scienceId: number, note: string): Promise<Done> {
        const key = `researchScienceById:${scienceId}`;
        if (!this.can(key)) return this.cant();

        const r = await researchScience(this.gameBot, { scienceId });
        if (!r) {
            throw Error(`researchScienceById: ${scienceId} failed; note: ${note}`);
        }

        return this.done(key);
    }
}
