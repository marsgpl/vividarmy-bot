var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var discord_js_1 = require('discord.js');
var GameBot_1 = require('class/GameBot');
var BaseBot_1 = require('class/BaseBot');
this;
DiscordBot,
    message;
discord_js_1["default"].Message,
    isUserAdmin;
boolean,
;
Promise();
var DiscordBot = (function (_super) {
    __extends(DiscordBot, _super);
    function DiscordBot(config) {
        _super.call(this, 'DiscordBot', config);
        this.commandsCache = {};
        this.async = start();
    }
    Object.defineProperty(DiscordBot.prototype, "state", {
        get: function () {
            if (!this._state)
                throw Error('DiscordBot: no state');
            return this._state;
        },
        enumerable: true,
        configurable: true
    });
    DiscordBot.prototype.Promise = ;
    return DiscordBot;
})(BaseBot_1.BaseBot);
exports.DiscordBot = DiscordBot;
void  > {
    const: mongoState = await, this: .connectToMongo(),
    const: discordState = await, this: .connectToDiscord(),
    const: gameBot = await, this: .createGameBot(mongoState),
    const: gameBotSvS = await, this: .createGameBotSvS(mongoState),
    this: ._state = {
        mongo: mongoState,
        discord: discordState,
        game: gameBot,
        gameSvS: gameBotSvS || gameBot
    },
    await: this.bindToDiscord()
};
async;
connectToDiscord();
Promise < DiscordState > {
    const: (_a = this, log = _a.log, config = _a.config, _a),
    const: client = new discord_js_1["default"].Client,
    await: client.login(config.discord.app.bot.token),
    return: {
        client: client
    }
};
async;
createGameBotSvS(mongoState, MongoState);
Promise < GameBot_1.GameBot | null > {
    const: (_b = this, config = _b.config, log = _b.log, _b),
    if: function () { } };
!config.discord.gameAccountSvS;
{
    return null;
}
var gameBot = new GameBot_1.GameBot(config, {
    gpToken: config.discord.gameAccountSvS.gpToken,
    cookieDocId: config.discord.gameAccountSvS.cookieDocId,
    cookieCollection: mongoState.collections.cookies
});
gameBot.reporter = function (text) {
    log('GameBot SvS:', text);
};
await;
gameBot.init();
log("game bot SvS created: gp_token=" + gameBot.getGpToken());
return gameBot;
async;
createGameBot(mongoState, MongoState);
Promise < GameBot_1.GameBot > (_c = ["game bot created: gp_token=", ""], _c.raw = ["game bot created: gp_token=", ""], ({
    const: (_d = this, config = _d.config, log = _d.log, _d),
    const: gameBot = new GameBot_1.GameBot(config, {
        gpToken: config.discord.gameAccount.gpToken,
        cookieDocId: config.discord.gameAccount.cookieDocId,
        cookieCollection: mongoState.collections.cookies
    }),
    gameBot: .reporter = function (text) {
        log('GameBot:', text);
    },
    await: gameBot.init(),
    log: function () { } })(_c, gameBot.getGpToken()));
;
return gameBot;
async;
bindToDiscord();
Promise < void  > {
    const: (_e = this, log = _e.log, state = _e.state, _e),
    const: discordClient = state ? .discord.client : ,
    if: function () { } };
!discordClient;
throw Error('no discordClient');
discordClient.on('ready', function () {
    var usertag = discordClient.user ? .tag : ;
    if (!usertag)
        throw Error('no user.tag');
    log("connected to discord: " + usertag);
});
discordClient.on('message', this.onDiscordMessage.bind(this));
async;
onDiscordMessage(message, discord_js_1["default"].Message);
Promise < void  > (_f = ["new message from discord: ", " (channel id=", ") (sender id=", " name=", "", ")"], _f.raw = ["new message from discord: ", " (channel id=", ") (sender id=", " name=", "", ")"], ({
    const: (_g = this, config = _g.config, log = _g.log, state = _g.state, _g),
    const: userId = message.author.id,
    const: userName = message.author.username,
    const: userTag = '#' + message.author.discriminator,
    const: channelId = message.channel.id,
    const: isFromItself = Boolean(userId === config.discord.app.clientId),
    const: isChannelAllowed = Boolean(config.discord.app.allowedChannelsIds[channelId]),
    const: isUserAdmin = Boolean(config.discord.app.adminUsersIds[userId]),
    if: function (isFromItself) {
        return;
    },
    log: function () { } })(_f, message.content, channelId, userId, userName, userTag));
;
if (!isChannelAllowed) {
    log("channel id=" + channelId + " is not allowed");
    return;
}
var commandName = this.getCommandNameFromMessageText(message.content);
if (!commandName) {
    log("only commands with text are allowed");
    return;
}
var command = this.getCommandByName(commandName);
if (!command) {
    var reply = "unknown command: '" + message.content + "'";
    log(reply);
    message.reply(reply);
    return;
}
state.gameSvS.reporter = function (text) {
    var msg = "GameBot SvS: " + text;
    message.channel.send(msg);
    log(msg);
};
state.game.reporter = function (text) {
    var msg = "GameBot: " + text;
    message.channel.send(msg);
    log(msg);
};
try {
    await;
    command.call(this, message, isUserAdmin);
    log("command `" + message.content + "` succeed");
}
catch (error) {
    var reply = "command `" + message.content + "` failed: " + error;
    log(reply);
    message.reply(reply);
}
getCommandNameFromMessageText(text, string);
string | undefined;
{
    var m = text.trim().match(/^([^\s]+)/);
    return m ? .[1].toLowerCase() || '' : ;
}
getCommandByName(commandName, string);
DiscordBotCommand | undefined;
{
    if (commandName.length === 0)
        return;
    var commandFromCache = this.commandsCache[commandName];
    if (commandFromCache) {
        return commandFromCache;
    }
    try {
        commandName = commandName.replace(/[^a-z0-9_-]/ig, '');
        var command_1 = require("discordCommands/" + commandName);
        this.commandsCache[commandName] = command_1.default;
    }
    catch (error) {
        this.log("command " + commandName + " not found: " + error);
    }
    return this.commandsCache[commandName];
}
findPlayerInMongo(name, string, serverId, number);
Promise < Player | null > {
    return: this.state.mongo.collections.players.findOne({
        nameLowercase: name.toLowerCase(),
        serverId: serverId
    })
};
findPlayerInMongoById(playerId, string);
Promise < Player | null > {
    return: this.state.mongo.collections.players.findOne({
        playerId: playerId
    })
};
async;
indexPlayer(player, Player);
Promise < void  > {
    await: (_h = this.state.mongo.collections.players).updateOne.apply(_h, [{
        playerId: player.playerId
    }, {
        $set: {} }].concat(player))
},
;
{
    upsert: true,
    ;
}
;
var _a, _b, _c, _d, _e, _f, _g, _h;
