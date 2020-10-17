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
import { Pos } from 'localTypes/Pos';
import spawnUnitFromBag from 'gameCommands/spawnUnitFromBag';
import claimEventReward from 'gameCommands/claimEventReward';
import reloadEventInfo from 'gameCommands/reloadEventInfo';
import claimEventMilestone from 'gameCommands/claimEventMilestone';

const js = JSON.stringify;

type Done = { done: boolean };

export interface PuppetOptions {
    puppetId: string;
    mongo: MongoState;
}

export interface PuppetState {
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

    public can(key: string): boolean {
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

        if (tankStage === 3) {
            const oldTanks = await this.gameBot.getUnitsByTypeId(99999);

            if (oldTanks.length > 0) {
                this.log(`old tank already claimed`);
                return this.done(key);
            }
        }

        const r = await this.gameBot.wsRPC(1652, { type: Number(tankStage) });
        if (r?.stat !== tankStage) throw Error(`fail: ${js(r)}`);

        r.endTime && await this.done('doAncientTank:endTime', r.endTime);

        // if (tankStage === 2) {
        //     this.log('waiting for 3m ...');
        //     await sleep(3 * 60 * 1000 + 1000);
        // }

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

    // {"c":117,"o":"871","p":{"id":805}}
    // {"c":117,"s":0,"d":"{\"unlockArea\":1}","o":"871"}
    public async buyBaseMapArea(baseMapAreaId: number): Promise<Done> {
        const key = `buyBaseMapArea:${baseMapAreaId}`;
        if (!this.can(key)) return this.cant();

        if (await this.gameBot.isBaseMapAreaAlreadyBought(baseMapAreaId)) {
            this.log(`base map area id=${baseMapAreaId} was already bought`);
            return this.done(key);
        }

        const r = await this.gameBot.wsRPC(117, { id: Number(baseMapAreaId) });
        if (!r?.unlockArea) throw Error(`fail: ${js(r)}`);

        // @TODO apply unlockArea

        return this.done(key);

        // @TODO async
        // {"c":10708,"s":0,"d":"{\"allAreaWar\":[{\"areaId\":805,\"chapterId\":1,\"pve_node\":{\"icon\":\"boss1\",\"name\":\"104117\",\"order\":1},\"extInfos\":[{\"itsBoss\":0,\"award\":0,\"levelPoint\":1}],\"finish\":0,\"pve_level\":{\"reward\":100101,\"node\":1,\"using\":1,\"player_number\":1,\"id\":101,\"enemy_type\":0,\"enemy_config\":\"10001\",\"cost_energy\":0,\"player_type\":0,\"order\":1,\"level_count\":1},\"pveId\":101}]}","o":null}
        // {"c":10707,"s":0,"d":"{\"msgType\":0,\"nowAreaWar\":{\"areaId\":805,\"chapterId\":1,\"pve_node\":{\"icon\":\"boss1\",\"name\":\"104117\",\"order\":1},\"extInfos\":[{\"itsBoss\":0,\"award\":0,\"levelPoint\":1}],\"finish\":0,\"pve_level\":{\"reward\":100101,\"node\":1,\"using\":1,\"player_number\":1,\"id\":101,\"enemy_type\":0,\"enemy_config\":\"10001\",\"cost_energy\":0,\"player_type\":0,\"order\":1,\"level_count\":1},\"pveId\":101}}","o":null}
        // {"c":10053,"s":0,"d":"{\"unlockArea\":\"1\"}","o":null}
    }

    public async spawnLvl4TanksFromBag(): Promise<Done> {
        const key = `spawnLvl4TanksFromBag`;
        if (!this.can(key)) return this.cant();

        await spawnUnitFromBag(this.gameBot, 10004, { x:24, y:28 });
        await spawnUnitFromBag(this.gameBot, 10004, { x:22, y:30 });
        await spawnUnitFromBag(this.gameBot, 10004, { x:23, y:29 });

        // pause between spawns to await for all async notifications
        await sleep(2000);

        return this.done(key);
    }

    public async spawnLvl5TanksFromBag(): Promise<Done> {
        const key = `spawnLvl5TanksFromBag`;
        if (!this.can(key)) return this.cant();

        await spawnUnitFromBag(this.gameBot, 10005, { x:26, y:26 });
        await spawnUnitFromBag(this.gameBot, 10005, { x:27, y:25 });
        await spawnUnitFromBag(this.gameBot, 10005, { x:28, y:24 });
        await spawnUnitFromBag(this.gameBot, 10005, { x:29, y:25 });

        // pause between spawns to await for all async notifications
        await sleep(2000);

        return this.done(key);
    }

    public async spawnLvl6TanksFromBag(): Promise<Done> {
        const key = `spawnLvl6TanksFromBag`;
        if (!this.can(key)) return this.cant();

        await spawnUnitFromBag(this.gameBot, 10006, { x:31, y:19 });
        await spawnUnitFromBag(this.gameBot, 10006, { x:30, y:20 });
        await spawnUnitFromBag(this.gameBot, 10006, { x:29, y:21 });
        await spawnUnitFromBag(this.gameBot, 10006, { x:28, y:22 });
        await spawnUnitFromBag(this.gameBot, 10006, { x:27, y:21 });

        // pause between spawns to await for all async notifications
        await sleep(2000);

        return this.done(key);
    }

    public async spawnLvl7TanksFromBag(): Promise<Done> {
        const key = `spawnLvl7TanksFromBag`;
        if (!this.can(key)) return this.cant();

        await spawnUnitFromBag(this.gameBot, 10007, { x:27, y:15 });
        await spawnUnitFromBag(this.gameBot, 10007, { x:26, y:16 });
        await spawnUnitFromBag(this.gameBot, 10007, { x:25, y:17 });
        await spawnUnitFromBag(this.gameBot, 10007, { x:24, y:18 });
        await spawnUnitFromBag(this.gameBot, 10007, { x:26, y:14 });
        await spawnUnitFromBag(this.gameBot, 10007, { x:23, y:17 });
        await spawnUnitFromBag(this.gameBot, 10007, { x:25, y:13 });
        await spawnUnitFromBag(this.gameBot, 10007, { x:22, y:16 });
        await spawnUnitFromBag(this.gameBot, 10007, { x:24, y:12 });
        await spawnUnitFromBag(this.gameBot, 10007, { x:23, y:13 });
        await spawnUnitFromBag(this.gameBot, 10007, { x:22, y:14 });
        await spawnUnitFromBag(this.gameBot, 10007, { x:21, y:15 });

        // pause between spawns to await for all async notifications
        await sleep(2000);

        return this.done(key);
    }

    // {"c":695,"o":"107","p":{"code":"topwar888"}} // 200 diamonds
    // {"c":695,"s":0,"d":"{\"reward\":{\"resource\":{\"gold\":200.0,\"oil\":0.0,\"voucher\":0.0,\"honor\":0.0,\"metal\":0.0,\"coal\":0.0,\"wood\":0.0,\"soil\":0.0,\"military\":0.0,\"expedition_coin\":0.0,\"jungong\":0.0,\"coin\":0.0},\"build\":[],\"armys\":[],\"hero\":[],\"exp\":0.0,\"giftExp\":0,\"items\":[],\"herosplit\":[],\"giftKey\":0,\"energy\":0}}","o":"107"}
    public async usePromoCode(promoCode: string): Promise<Done> {
        const key = `usePromoCode:${promoCode}`;
        if (!this.can(key)) return this.cant();

        const r = await this.gameBot.wsRPC(695, {
            code: String(promoCode),
        });

        if (!r?.reward) {
            this.log(`usePromoCode fail: ${js(r)}`);
            return this.done(key);
        }

        // @TODO apply reward

        return this.done(key);
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

        if (await this.gameBot.isBaseMapAreaStageAlreadyFought(baseMapAreaId, baseMapAreaStageId)) {
            this.log(`base map area id=${baseMapAreaId} pveId=${baseMapAreaStageId} was already fought for`);
            return this.done(key);
        }

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
        // {"c":10031,"s":0,"d":"{\"resource\":{\"gold\":0.0,\"oil\":0.0,\"voucher\":0.0,\"honor\":0.0,\"metal\":0.0,\"coal\":0.0,\"wood\":0.0,\"soil\":0.0,\"military\":0.0,\"expedition_coin\":0.0,\"jungong\":0.0,\"coin\":1000.0},\"build\":[],\"armys\":[],\"hero\":[],\"exp\":0.0,\"giftExp\":0,\"items\":[],\"herosplit\":[],\"giftKey\":0,\"energy\":0}","o":null}
    }

    public async claimEventReward({
        aid,
        tid,
    }: {
        aid: number;
        tid: number;
    }): Promise<Done> {
        const key = `claimEventReward:${aid}:${tid}`;
        if (!this.can(key)) return this.cant();

        const r = await claimEventReward(this.gameBot, { aid, tid });

        if (r) {
            return this.done(key);
        } else {
            return this.cant();
        }
    }

    public async claimEventMilestone({
        id,
        score,
        adv,
    }: {
        id: number;
        score: number;
        adv: number;
    }): Promise<Done> {
        const key = `claimEventMilestone:${id}:${score}:${adv}`;
        if (!this.can(key)) return this.cant();

        const r = await claimEventMilestone(this.gameBot, { id, score, adv });

        if (r) {
            return this.done(key);
        } else {
            return this.cant();
        }
    }

    // {"c":1152,"o":"140","p":{"multiple":0}}
    // {"c":1152,"s":0,"d":"{\"reward\":{\"resource\":{\"gold\":0.0,\"oil\":0.0,\"voucher\":0.0,\"honor\":0.0,\"metal\":0.0,\"coal\":0.0,\"wood\":0.0,\"soil\":0.0,\"military\":0.0,\"expedition_coin\":0.0,\"jungong\":0.0,\"coin\":0.0},\"build\":[],\"armys\":[{\"itemId\":10008,\"itemCount\":1}],\"hero\":[],\"exp\":0.0,\"giftExp\":0,\"items\":[],\"herosplit\":[],\"giftKey\":0,\"energy\":0},\"fakeAlReward\":1}","o":"140"}
    public async receiveUnitFromNpc(note: string): Promise<Done> {
        const key = `receiveUnitFromNpc:${note}`;
        if (!this.can(key)) return this.cant();

        const r = await this.gameBot.wsRPC(1152, {
            multiple: 0,
        });

        if (!r?.reward) {
            throw Error(`receiveUnitFromNpc fail: ${js(r)}`);
        }

        return this.done(key);
    }

    // {"c":835,"o":"48","p":{"username":"UTH1"}}
    // {"c":835,"s":0,"d":"{\"changeUserNameTimes\":1,\"username\":\"UTH1\"}","o":"48"}
    public async changeName(newName: string): Promise<Done> {
        const key = `changeName:${newName}`;
        if (!this.can(key)) return this.cant();

        const r = await this.gameBot.wsRPC(835, {
            username: String(newName),
        });

        if (r?.username !== newName) {
            throw Error(`changeName failed: ${js(r)}`);
        }

        return this.done(key);
    }

    // {"c":1344,"o":"52","p":{"flag":233}}
    // {"c":1344,"s":0,"d":"{\"nationalFlag\":233,\"changeNationalFlagTimes\":1}","o":"52"}
    public async changeFlag(newFlagId: number): Promise<Done> {
        const key = `changeFlag:${newFlagId}`;
        if (!this.can(key)) return this.cant();

        const r = await this.gameBot.wsRPC(1344, {
            flag: Number(newFlagId),
        });

        if (r?.nationalFlag !== newFlagId) {
            throw Error(`changeFlag failed: ${js(r)}`);
        }

        return this.done(key);
    }

    // {"c":851,"o":"54","p":{"userGender":1}}
    // {"c":851,"s":0,"d":"{\"userGender\":1,\"changeUserGenderTimes\":1}","o":"54"}
    public async changeGender(newGender: number): Promise<Done> {
        const key = `changeGender:${newGender}`;
        if (!this.can(key)) return this.cant();

        const r = await this.gameBot.wsRPC(851, {
            userGender: Number(newGender),
        });

        if (r?.userGender !== newGender) {
            throw Error(`changeGender failed: ${js(r)}`);
        }

        return this.done(key);
    }

    // {"c":815,"o":"92","p":{"itemid":1800001,"amount":250}}
    public async useAllBlueScienceBoxes(): Promise<Done> {
        const key = `useAllBlueScienceBoxes`;
        if (!this.can(key)) return this.cant();

        const bb = await this.gameBot.getItemByTypeId(1800001);

        if (!bb) {
            throw Error(`blue science boxes not found`);
        }

        const r = await this.gameBot.wsRPC(815, {
            itemid: Number(1800001),
            amount: bb.amount,
        });

        if (typeof r === 'string') {
            throw Error(`useAllBlueScienceBoxes failed: ${js(r)}`);
        }

        return this.done(key);
    }

    // {"c":902,"o":"65","p":{"marchType":19,"x":256,"y":512,"armyList":[{"pos":1,"armyId":99999,"armyNum":1}],"armyListNew":[{"pos":1,"armyId":99999,"armyNum":1}],"heroList":[101],"trapList":[]}}
    // {"c":902,"s":0,"d":"{\"marchInfo\":{\"gatherStartTime\":0,\"armyLoad\":\"0.0\",\"marchArrive\":1602959167,\"language\":\"ja\",\"k\":601,\"returnStartTime\":0,\"marchSkin\":0,\"target\":{\"itemId\":1001,\"tx\":256,\"ty\":512,\"tk\":601,\"targetType\":10},\"uid\":318506795609,\"marchType\":19,\"marchStartTime\":1602958938,\"armySkin\":\"\",\"gatherspeed\":\"0.0\",\"name\":\"UTH1\",\"returnArriveTime\":0,\"marchIcon\":0,\"state\":1,\"marchId\":\"1713513073350370313\",\"aid\":100109657,\"begin\":{\"bx\":28,\"by\":524,\"bk\":601,\"k\":601}}}","o":"139"}
    public async reinforceCapitalWithSingleUnit(unitTypeId: number): Promise<void> {
        const r = await this.gameBot.wsRPC(902, {
            marchType: 19,
            x: 256,
            y: 512,
            armyList: [{pos:1,armyId:unitTypeId,armyNum:1}],
            armyListNew: [{pos:1,armyId:unitTypeId,armyNum:1}],
            heroList: [],
            trapList: [],
        });

        if (!r?.marchInfo) {
            throw Error(`reinforceCapitalWithSingleUnit failed: ${js(r)}`);
        }
    }

    // {"c":1114,"o":"37","p":{"allianceId":100109669}}
    // {"c":1114,"s":0,"d":"{\"allianceInfo\":{\"joinTime\":1602960914,\"memberCount\":2,\"memberMax\":50,\"serverId\":601,\"firstJoin\":1,\"createTime\":1602960765,\"leaderName\":\"wy.318511096409\",\"rank\":1,\"power\":5813.0,\"basic\":{\"addMembersMax\":0,\"giftLevel\":1,\"symbolColor\":1,\"provinceLimit\":-1,\"giftExp\":0,\"type\":0,\"giftKey\":0,\"sid\":601,\"levelLimit\":0,\"maxMembers\":50,\"symbolTotem\":2,\"createTime\":1602960765,\"joinType\":0,\"members\":2,\"name\":\"UTH51\",\"tag\":\"UTH2\",\"lang\":\"\",\"haveBadge\":\"1,2,100\",\"symbolBase\":0,\"starNum\":0},\"manifesto\":\"\",\"aid\":100109669,\"leaderUid\":318511096409,\"slogan\":\"\",\"notice\":\"\",\"addmemberMax\":0}}","o":"37"}
    public async joinAlliance(allianceId: number): Promise<void> {
        const r = await this.gameBot.wsRPC(1114, {
            allianceId: Number(allianceId),
        });

        if (!r?.allianceInfo) {
            throw Error(`joinAlliance failed: ${js(r)}`);
        }
    }

    // {"c":1128,"o":"69","p":{}}
    // {"c":1128,"s":0,"d":"{\"allianceId\":100109691,\"statusCode\":0}","o":"69"}
    public async leaveAlliance(): Promise<void> {
        const r = await this.gameBot.wsRPC(1128, {});

        if (!r?.allianceId) {
            throw Error(`leaveAlliance failed: ${js(r)}`);
        }
    }

    // {"c":1100,"o":"118","p":{"name":"UTH1","tag":"UTH1","symbolTotem":2,"joinType":0,"levelLimit":0,"provinceLimit":-1,"lang":""}}
    // {"c":1100,"s":0,"d":"{\"allianceInfo\":{\"joinTime\":1602958914,\"memberCount\":1,\"memberMax\":50,\"serverId\":601,\"createTime\":1602958914,\"leaderName\":\"UTH1\",\"rank\":5,\"power\":6803.0,\"basic\":{\"addMembersMax\":0,\"giftLevel\":0,\"symbolColor\":9,\"provinceLimit\":-1,\"giftExp\":0,\"type\":0,\"giftKey\":0,\"sid\":601,\"levelLimit\":0,\"maxMembers\":50,\"symbolTotem\":2,\"createTime\":1602958914,\"joinType\":0,\"members\":1,\"name\":\"UTH1\",\"tag\":\"UTH1\",\"lang\":\"\",\"haveBadge\":\"1,2,100\",\"symbolBase\":0,\"starNum\":0},\"manifesto\":\"\",\"aid\":100109657,\"leaderUid\":318506795609,\"slogan\":\"\",\"notice\":\"\",\"addmemberMax\":0},\"statusCode\":0}","o":"118"}
    public async createAlliance({ name, tag }: { name: string; tag: string; }): Promise<Done> {
        const key = `createAlliance:${name}:${tag}`;
        if (!this.can(key)) return this.cant();

        const r = await this.gameBot.wsRPC(1100, {
            name: String(name),
            tag: String(tag),
            symbolTotem: 2,
            joinType: 0,
            levelLimit: 0,
            provinceLimit: -1,
            lang: '',
        });

        if (!r?.allianceInfo) {
            throw Error(`createAlliance fail: ${js(r)}`);
        }

        this.log(`alliance created: aid=${r?.allianceInfo?.aid}`);

        return this.done(key);
    }

    // {"c":109,"o":"50","p":{"x":20,"y":20,"id":1023}}
    // {"c":109,"s":0,"d":"{\"reward\":{\"resource\":{\"gold\":0.0,\"oil\":0.0,\"voucher\":0.0,\"honor\":0.0,\"metal\":0.0,\"coal\":0.0,\"wood\":0.0,\"soil\":0.0,\"military\":0.0,\"expedition_coin\":0.0,\"jungong\":0.0,\"coin\":500.0},\"build\":[],\"armys\":[],\"hero\":[],\"exp\":0.0,\"giftExp\":0,\"items\":[],\"herosplit\":[],\"giftKey\":0,\"energy\":0},\"x\":20,\"y\":20}","o":"50"}
    public async removeObstacle(obstacleId: number, pos: Pos, note: string): Promise<Done> {
        const key = `removeObstacle:${obstacleId}:${pos.x},${pos.y}`;
        if (!this.can(key)) return this.cant();

        const r = await this.gameBot.wsRPC(109, {
            x: Number(pos.x),
            y: Number(pos.y),
            id: Number(obstacleId),
        });

        if (!r?.reward) {
            throw Error(`removeObstacle fail: ${js(r)}`);
        }

        // @TODO apply reward

        return this.done(key);
    }

    public async relocateOldTankToLeft(): Promise<Done> {
        const key = `relocateOldTankToLeft`;
        if (!this.can(key)) return this.cant();

        const oldTanks = await this.gameBot.getUnitsByTypeId(99999);
        if (oldTanks.length !== 1) {
            throw Error(`expected: old tanks x1, got: x${oldTanks.length}`);
        }

        const r = await relocateUnit(this.gameBot, oldTanks[0], { x:14, y:24 });
        if (!r) {
            throw Error(`relocation failed`);
        }

        return this.done(key);
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

    public async relocateLvl6AndOldToTop(): Promise<Done> {
        const key = `relocateLvl6AndOldToTop`;
        if (!this.can(key)) return this.cant();

        const oldTanks = await this.gameBot.getUnitsByTypeId(99999);
        if (oldTanks.length !== 1) {
            throw Error(`expected: old tanks x1, got: x${oldTanks.length}`);
        }

        if (!await relocateUnit(this.gameBot, oldTanks[0], { x:20, y:16 })) {
            throw Error(`relocation failed`);
        }

        const lvl6Tanks = await this.gameBot.getUnitsByTypeId(10006);
        if (lvl6Tanks.length !== 3) {
            throw Error(`expected: lvl6 tanks x3, got: x${lvl6Tanks.length}`);
        }

        if (!await relocateUnit(this.gameBot, lvl6Tanks[0], { x:19, y:17 })) {
            throw Error(`relocation failed`);
        }
        if (!await relocateUnit(this.gameBot, lvl6Tanks[1], { x:20, y:18 })) {
            throw Error(`relocation failed`);
        }
        if (!await relocateUnit(this.gameBot, lvl6Tanks[2], { x:21, y:17 })) {
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
        await sleep(2000);

        if (!await build(bot, 1701, { x:24, y:24 })) throw Error(`failed to build`);
        if (!await build(bot, 1701, { x:26, y:22 })) throw Error(`failed to build`);

        // wait for building delta apply
        await sleep(2000);

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

        if (building.length < 1) {
            throw Error(`repairBuildingByTypeId: ${buildingTypeId}: expected more than 1; note: ${note}`);
        }

        const reparable = building.filter(b => b.broken === 1);

        if (!reparable.length) {
            this.log(`building type=${buildingTypeId} already repaired (${note})`);
            return this.done(key);
        }

        await asyncForeach<Building>(reparable, async building => {
            await repairBuilding(this.gameBot, { buildingId: building.id });
        });

        this.log(`${note} x${reparable.length} repaired`);

        return this.done(key);
    }

    public async researchScienceById(scienceId: number, note: string): Promise<Done> {
        const key = `researchScienceById:${scienceId}`;
        if (!this.can(key)) return this.cant();

        const r = await researchScience(this.gameBot, { scienceId });
        if (!r) {
            throw Error(`researchScienceById: ${scienceId} failed; note: ${note}`);
        }

        this.log(note);

        return this.done(key);
    }

    public async buildBookCenter(): Promise<Done> {
        const key = `buildBookCenter`;
        if (!this.can(key)) return this.cant();

        const r = await build(this.gameBot, 2401, { x:20, y:20 });

        if (!r) {
            throw Error(`failed to build`);
        }

        return this.done(key);
    }

    public async build3barracksLvl2(): Promise<Done> {
        const key = `build3barracksLvl2`;
        if (!this.can(key)) return this.cant();

        const bot = this.gameBot;

        if (!await build(bot, 1042, { x:22, y:22 })) throw Error(`failed to build`);
        if (!await build(bot, 1042, { x:24, y:20 })) throw Error(`failed to build`);
        if (!await build(bot, 1042, { x:22, y:18 })) throw Error(`failed to build`);

        // wait for building delta apply
        await sleep(2000);

        const barracks = await bot.getBuildingsByTypeId(1042);

        if (barracks.length != 4) {
            throw Error(`expected 4 buildings of type 1042, got: ${barracks.length}`);
        }

        return this.done(key);
    }

    public disconnectFromGame(): void {
        this.gameBot.disconnectFromWs();
    }
}
