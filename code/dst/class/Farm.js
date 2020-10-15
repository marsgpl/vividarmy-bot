var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BaseBot_1 = require('./BaseBot');
var Puppet_1 = require('./Puppet');
this;
Farm;
Promise();
var Farm = (function (_super) {
    __extends(Farm, _super);
    function Farm(config) {
        _super.call(this, 'Farm', config);
        this.commandsCache = {};
        this.async = start();
    }
    Object.defineProperty(Farm.prototype, "state", {
        get: function () {
            if (!this._state)
                throw Error('Farm: no state');
            return this._state;
        },
        enumerable: true,
        configurable: true
    });
    Farm.prototype.Promise = ;
    return Farm;
})(BaseBot_1.BaseBot);
exports.Farm = Farm;
void  > {
    const: (_a = this, log = _a.log, _a),
    const: mongoState = await, this: .connectToMongo(),
    this: ._state = {
        mongo: mongoState
    },
    const: commandName = process.argv[2],
    if: function () { } };
!commandName;
{
    throw Error("unable to get command name from args");
}
var command = this.getCommandByName(commandName);
if (!command) {
    throw Error("unknown command: " + commandName);
}
try {
    await;
    command.call(this);
    log("command succeed: " + commandName);
    process.exit(0);
}
catch (error) {
    log("command failed: " + commandName);
    throw error;
}
getCommandByName(commandName, string);
FarmCommand | undefined;
{
    if (commandName.length === 0)
        return;
    var commandFromCache = this.commandsCache[commandName];
    if (commandFromCache) {
        return commandFromCache;
    }
    try {
        commandName = commandName.replace(/[^a-z0-9_-]/ig, '');
        var command_1 = require("farmCommands/" + commandName);
        this.commandsCache[commandName] = command_1.default;
    }
    catch (error) {
        this.log("command " + commandName + " not found: " + error);
    }
    return this.commandsCache[commandName];
}
async;
getPuppetById(puppetId, string);
Promise < Puppet_1.Puppet > {
    if: function () { } };
!puppetId;
throw Error('no puppetId');
var puppet = new Puppet_1.Puppet(this.config, {
    puppetId: puppetId,
    mongo: this.state.mongo
});
await;
puppet.init();
return puppet;
var _a;
