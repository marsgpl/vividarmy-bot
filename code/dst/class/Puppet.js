var _this = this;
var log_1 = require('modules/log');
var GameBot_1 = require('./GameBot');
var randomString_1 = require('modules/randomString');
var randomNumber_1 = require('modules/randomNumber');
var asyncForeach_1 = require('modules/asyncForeach');
var sleep_1 = require('modules/sleep');
var repairBuilding_1 = require('gameCommands/repairBuilding');
var build_1 = require('gameCommands/build');
var js = JSON.stringify;
var Puppet = (function () {
    function Puppet(config, options) {
        this.config = config;
        this.options = options;
        this.async = saveGpToken();
        this.log = log_1["default"].setName("Puppet#" + options.puppetId);
    }
    Object.defineProperty(Puppet.prototype, "state", {
        get: function () {
            if (!this._state)
                throw Error('Puppet: no state');
            return this._state;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Puppet.prototype, "gameBot", {
        get: function () {
            if (!this._gameBot)
                throw Error('Puppet: no gameBot');
            return this._gameBot;
        },
        enumerable: true,
        configurable: true
    });
    Puppet.prototype.Promise = ;
    return Puppet;
})();
exports.Puppet = Puppet;
void  > {
    this: .state.gpToken = this.gameBot.getGpToken(),
    if: function () { } };
!this.state.gpToken;
throw Error('no gpToken');
this.log("saving gp_token=" + this.state.gpToken);
await;
this.saveState();
async;
init();
Promise < void  > (_a = ["game bot created: gp_token=", ""], _a.raw = ["game bot created: gp_token=", ""], ({
    const: (_b = this, log = _b.log, _b),
    const: state = await, this: .loadState(),
    if: function (state) {
        this._state = state;
    }, else: {
        this: ._state = this.createState(),
        await: this.saveState()
    },
    this: ._gameBot = new GameBot_1.GameBot(this.config, {
        gpToken: String(this.state.gpToken || ''),
        cookieDocId: "puppet:" + this.options.puppetId,
        cookieCollection: this.options.mongo.collections.cookies,
        userAgent: this.state.userAgent,
        aliSAFDataHash: this.state.aliSAFDataHash,
        aliSAFDataDetail: this.state.aliSAFDataDetail
    }),
    this: .gameBot.reporter = function (text) {
        log('GameBot:', text);
    },
    await: this.gameBot.init(),
    log: function () { } })(_a, this.gameBot.getGpToken()));
;
async;
saveState();
Promise < void  > {
    const: r = await, this: .options.mongo.collections.puppets.updateOne({
        _id: this.options.puppetId
    }, {
        $set: this.state
    }, {
        upsert: true
    }),
    if: function () { } };
!r ? .result ? .ok :  : ;
{
    throw Error("failed to save state: " + r);
}
this.log('state saved');
createState();
PuppetState;
{
    var state = {
        targetServerId: this.config.farm.targetServerId,
        gpToken: '',
        userAgent: this.generateUserAgent(),
        aliSAFDataHash: randomString_1["default"](88, randomString_1["default"].alpha.azAZ09_),
        aliSAFDataDetail: '',
        switch: {}
    };
    this.log('new state created');
    return state;
}
generateUserAgent();
string;
{
    var userAgent = this.config.browser.userAgentTemplate
        .replace(/:v1:/g, randomNumber_1["default"](536, 537) + "." + randomNumber_1["default"](1, 99))
        .replace(/:v2:/g, randomNumber_1["default"](81, 85) + "." + randomNumber_1["default"](0, 12) + "." + randomNumber_1["default"](1, 5000) + "." + randomNumber_1["default"](1, 200));
    this.log("userAgent created: " + userAgent);
    return userAgent;
}
async;
loadState();
Promise < PuppetState | null > {
    const: r = await, this: .options.mongo.collections.puppets.findOne({
        _id: this.options.puppetId
    }),
    if: function () { } };
!r ? .targetServerId : ;
{
    return null;
}
this.log("state loaded");
r.switch = r.switch || {};
return r;
as;
PuppetState;
can(key, string);
boolean;
{
    if (this.state.switch[key])
        return false;
    return true;
}
cant();
Done;
{
    return { done: false };
}
async;
done(key, string, value, any = true);
Promise < Done > {
    this: .log("done: " + key),
    this: .state.switch[key] = value,
    await: this.saveState(),
    return: { done: true }
};
async;
doAncientTank(tankStage, number);
Promise < Done > {
    const: key = "doAncientTank:" + tankStage,
    if: function () { } };
!this.can(key);
return this.cant();
var r = await;
this.gameBot.wsRPC(1652, { type: Number(tankStage) });
if (r ? .stat !== tankStage : ) {
    if (tankStage === 2) {
        this.gameBot.reporter("doAncientTank:" + tankStage + " fail: " + js(r));
    }
    else {
        throw Error('fail: ${js(r)}`');
    }
}
r.endTime && await;
this.done('doAncientTank:endTime', r.endTime);
if (r.endTime) {
    this.done(key);
    this.log("waiting 3 minutes for tank repair ...");
    await;
    sleep_1["default"](3 * 60 * 1000);
}
return this.done(key);
async;
moveTutorial(tutorialStage, number);
Promise < Done > {
    const: key = "moveTutorial:" + tutorialStage,
    if: function () { } };
!this.can(key);
return this.cant();
var r = await;
this.gameBot.wsRPC(814, { text: String(tutorialStage) });
if (r ? .text !== String(tutorialStage) : )
    throw Error("fail: " + js(r));
return this.done(key);
async;
mergeUnitsWhilePossible(keySuffix, string);
Promise < Done > {
    const: key = "mergeUnitsWhilePossible:" + keySuffix,
    if: function () { } };
!this.can(key);
return this.cant();
var mergedOverall = 0;
while (true) {
    var merged = 0;
    var groups = await;
    this.gameBot.getMergeableUnitsGroups();
    await;
    asyncForeach_1["default"](Object.keys(groups), async, function (unitTypeId) {
        var units = groups[unitTypeId];
        for (var i = 0; i < units.length - 1; i += 2) {
            var unit1 = units[i];
            var unit2 = units[i + 1];
            // now kiss
            var r_1 = await, mergeUnits_1 = (_this.gameBot, {
                delId: unit1.id,
                targetId: unit2.id
            });
            if (!r_1)
                break;
            merged++;
            mergedOverall++;
        }
    });
    if (merged === 0)
        break;
    // pause between merges to await for all async notifications about units delta
    await;
    sleep_1["default"](2000);
}
if (!mergedOverall) {
    throw Error('no units were merged');
}
return this.done(key);
async;
buyBaseMapArea(baseMapAreaId, number);
Promise < Done > {
    const: key = "buyBaseMapArea:" + baseMapAreaId,
    if: function () { } };
!this.can(key);
return this.cant();
var r = await;
this.gameBot.wsRPC(117, { id: Number(baseMapAreaId) });
if (!r ? .unlockArea : )
    throw Error("fail: " + js(r));
// @TODO apply unlockArea
return this.done(key);
async;
fightBaseMapArea(baseMapAreaId, number, baseMapAreaStageId, number, unitsToFightWith, Unit[]);
Promise < Done > {
    const: key = "fightBaseMapArea:" + baseMapAreaId + ":" + baseMapAreaStageId,
    if: function () { } };
!this.can(key);
return this.cant();
// @TODO heroList
// @TODO trapList
var r = await;
this.gameBot.wsRPC(420, {
    pveId: Number(baseMapAreaStageId),
    armyList: unitsToFightWith.map(function (u) { return u.id; }),
    areaId: Number(baseMapAreaId),
    heroList: [],
    trapList: []
});
if (!r ? .reward : ) {
    throw Error("fightBaseMapArea fail: " + js(r));
}
// @TODO apply reward
return this.done(key);
async;
relocateInitialLvl4Unit();
Promise < Done > {
    const: key = "relocateInitialLvl4Unit",
    if: function () { } };
!this.can(key);
return this.cant();
var lvl4ArmyUnit = await;
this.gameBot.getUnitsByTypeId(10004);
if (lvl4ArmyUnit.length !== 1) {
    throw Error("expected: lvl4 army unit x1, got: x" + lvl4ArmyUnit.length);
}
var r = await, relocateUnit = (this.gameBot, lvl4ArmyUnit[0], { x: 13, y: 23 });
if (!r) {
    throw Error("relocation failed");
}
return this.done(key);
async;
build5goldMinesLvl1();
Promise < Done > {
    const: key = "build5goldMinesLvl1",
    if: function () { } };
!this.can(key);
return this.cant();
var bot = this.gameBot;
if (!await)
    build_1["default"](bot, 1701, { x: 18, y: 26 });
throw Error("failed to build");
if (!await)
    build_1["default"](bot, 1701, { x: 20, y: 24 });
throw Error("failed to build");
if (!await)
    build_1["default"](bot, 1701, { x: 22, y: 26 });
throw Error("failed to build");
// wait for treasure task claim apply
await;
sleep_1["default"](3000);
if (!await)
    build_1["default"](bot, 1701, { x: 24, y: 24 });
throw Error("failed to build");
if (!await)
    build_1["default"](bot, 1701, { x: 26, y: 22 });
throw Error("failed to build");
// wait for building delta apply
await;
sleep_1["default"](3000);
var goldMines = await, bot, getBuildingsByTypeId = (1701);
if (goldMines.length != 8) {
    throw Error("expected 8 buildings of type 1701, got: " + goldMines.length);
}
return this.done(key);
async;
repairBuildingsByTypeId(buildingTypeId, number, note, string);
Promise < Done > {
    const: key = "repairBuildingByTypeId:" + buildingTypeId,
    if: function () { } };
!this.can(key);
return this.cant();
var building = await;
this.gameBot.getBuildingsByTypeId(buildingTypeId);
var reparable = building.filter(function (b) { return b.broken === 1; });
if (reparable.length < 1) {
    throw Error("repairBuildingByTypeId: " + buildingTypeId + ": expected more than 1; note: " + note);
}
await;
asyncForeach_1["default"](reparable, async, function (building) {
    await;
    repairBuilding_1["default"](_this.gameBot, { buildingId: building.id });
});
return this.done(key);
async;
researchScienceById(scienceId, number, note, string);
Promise < Done > {
    const: key = "researchScienceById:" + scienceId,
    if: function () { } };
!this.can(key);
return this.cant();
var r = await, researchScience = (this.gameBot, { scienceId: scienceId });
if (!r) {
    throw Error("researchScienceById: " + scienceId + " failed; note: " + note);
}
return this.done(key);
var _a, _b;
