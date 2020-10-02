import Discord from 'discord.js';

import { GameBot } from 'class/GameBot';
import { BaseBot } from 'class/BaseBot';
import { Config } from 'class/Config';
import { DiscordState } from 'state/DiscordState';
import { MongoState } from 'state/MongoState';
import { CookieJar, CookieJarStorageType } from 'modules/CookieJar';
import formatPower from 'helpers/formatPower';
import formatGender from 'helpers/formatGender';

const cmdNameMatchTab: {[key: string]: string} = {
    find: 'showPlayerInfo',
    info: 'showPlayerInfo',
    index: 'indexTopXPlayers',
};

interface DiscordBotState {
    mongo: MongoState;
    discord: DiscordState;
    game: GameBot;
}

export class DiscordBot extends BaseBot {
    protected state?: DiscordBotState;

    constructor(config: Config) {
        super('DiscordBot', config);
    }

    public async start(): Promise<void> {
        const mongoState = await this.connectToMongo();
        const discordState = await this.connectToDiscord();
        const gameBot = await this.createGameBot(mongoState);

        this.state = {
            mongo: mongoState,
            discord: discordState,
            game: gameBot,
        };

        await this.bindToDiscord();
    }

    protected async bindToDiscord(): Promise<void> {
        if (!this.state) throw Error('no state');

        const { log } = this;
        const discordClient = this.state.discord.client;

        discordClient.on('ready', () => {
            const tag = discordClient.user?.tag;

            if (!tag) {
                throw Error('failed to connect to discord');
            }

            log('connected to discord:', tag);
        });

        discordClient.on('message', async msg => {
            if (!this.state) throw Error('no state');

            const { log, config } = this;

            const channelId = msg.channel.id;
            const userId = msg.author.id;
            const userName = msg.author.username;
            const userDiscr = msg.author.discriminator;

            if (userId === config.discord.app.clientId) {
                // message from itself
                return;
            }

            log(`new discord msg: ${msg.content} (channel id=${channelId}) (sender: ${userName}#${userDiscr} id=${userId})`);

            const isChannelAllowed = Boolean(config.discord.app.allowedChannelsIds[channelId]);
            const isUserAdmin = Boolean(config.discord.app.adminUsersIds[userId]);

            if (!isChannelAllowed) {
                log(`channel id=${channelId} is not allowed in config`);
                return;
            }

            let [, cmdName] = msg.content.match(/^([^\s]+)/) || [];
            cmdName = cmdNameMatchTab[cmdName] || cmdName;
            const cmdFu: undefined | Function = (this as any)[`cmd_${cmdName}`];

            const reporter = (text: string, asReply?: boolean): void => {
                log(text);
                asReply ? msg.reply(text) : msg.channel.send(text);
            };

            this.state.game.reporter = reporter;

            if (cmdFu) {
                try {
                    await cmdFu.call(this, msg);
                } catch (error) {
                    return reporter(`error: ${error.message || error}`, true);
                }
            } else {
                return reporter(`unknown command: ${cmdName}`, true);
            }
        });
    }

    protected async cmd_indexTopXPlayers(msg: Discord.Message): Promise<void> {
        if (!this.state) throw Error('no state');

        const { config, state } = this;
        const { game } = state;
        const { reporter } = game;

        const USAGE = [
            'usage example: index 1000',
                'min: 30, max: 10000',
        ].join('\n    ');

        const [, limit] = msg.content.match(/^[a-z]+\s+(.*)$/i) || [];
        const indexLimit = Number(limit);

        if (indexLimit < 30 || indexLimit > 10000) {
            return reporter(USAGE, true);
        }

        const PAGE_SIZE = 30;

        let offsetFrom = 0;
        let offsetTo = offsetFrom + PAGE_SIZE - 1;

        while (offsetTo < indexLimit) {
            const topPlayersInfo = await game.getTopPlayers({
                offsetFrom,
                offsetTo,
                noReport: offsetFrom % 300 !== 0,
            });

            offsetFrom += PAGE_SIZE;
            offsetTo += PAGE_SIZE;

            for (let i = 0; i < topPlayersInfo.list.length; ++i) {
                const info = topPlayersInfo.list[i];
                const playerId = Number(info.uid);
                const playerInfo = JSON.parse(info.playerInfo);
                const playerName = playerInfo.username || playerInfo.nickname;
                await this.indexPlayer(playerId, playerName);
            }

            if (!topPlayersInfo.list.length) break;
        }

        reporter(`indexing ${indexLimit} done`, true);
    }

    protected async cmd_showPlayerInfo(msg: Discord.Message): Promise<void> {
        if (!this.state) throw Error('no state');

        const { config } = this;
        const { reporter } = this.state.game;

        const USAGE = [
            'usage examples:',
                'find DoomStar',
                'find top 1',
                `find ${config.discord.gameAccount.id}`,
        ].join('\n    ');

        const [, playerNameOrIdOrRank] = msg.content.match(/^[a-z]+\s+(.*)$/i) || [];

        if (!playerNameOrIdOrRank) {
            return reporter(USAGE, true);
        }

        const [, playerId] = playerNameOrIdOrRank.match(/^([0-9]{9,})$/i) || [];
        const [,, playerRank] = playerNameOrIdOrRank.match(/^(rank|top)\s+([0-9]+)$/i) || [];
        const playerName = !playerId && !playerRank && playerNameOrIdOrRank;

        if (playerId) {
            await this.showPlayerInfoById(msg, Number(playerId));
        } else if (playerRank) {
            await this.showPlayerInfoByRank(msg, Number(playerRank));
        } else if (playerName) {
            await this.showPlayerInfoByName(msg, playerName);
        } else {
            throw Error('input mismatch');
        }
    }

    protected async showPlayerInfoById(msg: Discord.Message, playerId: number): Promise<void> {
        if (!this.state) throw Error('no state');

        const { game } = this.state;
        const { reporter } = game;

        reporter(`searching for player with id=${playerId}`);

        const playerInfo = await game.getPlayerInfo({ playerId });
        const playerPosInfo = await game.getPlayerPosInfo({ playerId });

        const info = this.formatPlayerInfo(playerInfo, playerPosInfo);

        this.indexPlayer(info.playerId, info.name); // async but we will not wait

        reporter(`\`${msg.content}\`:\n    ${info.formatted.join('\n    ')}`, true);
    }

    protected formatPlayerInfo(playerInfoResponse: any, playerPosInfoResponse: any): {[key: string]: any} {
        const point = playerPosInfoResponse?.point || {};
        const pointPlayer = point.p || {};
        const playerInfo = JSON.parse(playerInfoResponse.playerInfo || pointPlayer.playerInfo) || {};

        const playerId = String(playerInfoResponse.uid || '') || String(Number(pointPlayer.pid) || ''); // 307176813145
        const allianceId = Number(playerInfoResponse.allianceId); // 100067575
        const allianceName = String(playerInfoResponse.allianceName || ''); // CobraKaiDojo
        const allianceTag = String(playerInfoResponse.allianceTag || '') || String(pointPlayer.a_tag || ''); // CKD
        const banEndTime = Number(playerInfoResponse.banEndTime); // 0
        const level = Number(playerInfoResponse.level) || Number(pointPlayer.level); // 74
        const worldId = Number(playerInfoResponse.worldId); // 27
        const showCareerId = Number(playerInfoResponse.showCareerId); // 1002702
        const power = Number(playerInfoResponse.power) || Number(pointPlayer.power); // 1.795250197479538e+27

        const flagId = Number(playerInfo.nationalflag); // 167
        const gender = Number(playerInfo.gender) || Number(playerInfo.usergender); // 0 - not specified, 1 - male, 2 - female
        const avatar = String(playerInfo.headimgurl_custom || '') || String(playerInfo.headimgurl || '') || String(playerInfo.avatarurl || ''); // idstring or url
        const name = String(playerInfo.username || '') || String(playerInfo.nickname || ''); // Swenor

        const x = Number(point.x); // 354
        const y = Number(point.y); // 450
        const serverId = Number(point.k) || Number(pointPlayer.w); // 601
        const locationId = point.id; // 115378
        const locationType = point.pointType; // 1

        const plateId = Number(pointPlayer.plateId); // 1
        const sBNum = Number(pointPlayer.sBNum); // 0
        const shieldTime = Number(pointPlayer.shieldTime); // 1601244890
        const fireTime = Number(pointPlayer.fireTime); // 0
        const castleEffectId = Number(pointPlayer.castleEffectId); // 7
        const skinId = Number(pointPlayer.skinId); // 1710700
        const language = String(pointPlayer.language || ''); // 'en'
        const sml = Number(pointPlayer.sml); // 0
        const province = Number(pointPlayer.province); // 27
        const sskin = Number(pointPlayer.sskin); // 0
        const fireState = Number(pointPlayer.fireState); // 0
        const aid = Number(pointPlayer.aid); // 100067575
        const countryRank = Number(pointPlayer.countryRank); // 0
        const sBId = Number(pointPlayer.sBId); // 0

        const now = Math.floor(Date.now() / 1000);

        const powerFormatted = formatPower(power);
        const genderFormatted = formatGender(gender);
        const positionFormatted = x && y ? `${x},${y}` : 'missing';
        const fullNameFormatted = allianceTag ? `[${allianceTag}] ${name}` : name;
        const allianceFormatted = allianceId ? `${allianceName} [${allianceTag}] id=${allianceId}` : 'none';
        const avatarFormatted = avatar && avatar.indexOf('http') === 0 ? `<${avatar}>` : avatar;
        const banFormatted = !banEndTime || banEndTime < now ? 'no' : `BANNED UNTIL ${new Date(banEndTime * 1000)}`;
        const shieldFormatted = !shieldTime || shieldTime < now ? 'no' : `SHIELD UNTIL ${new Date(shieldTime * 1000)}`;
        const fireFormatted = !fireTime || fireTime < now ? 'no' : `BURNING UNTIL ${new Date(fireTime * 1000)}`;
        const serverFormatted = serverId || 'missing';

        const formatted: string[] = [
            fullNameFormatted,
            `level: ${level}`,
            `power: ${powerFormatted}`,
            `position: ${positionFormatted}`,
            `alliance: ${allianceFormatted}`,
            `server: ${serverFormatted}`,
            `gender: ${genderFormatted}`,
            `language: ${language || 'missing'}`,
            `profile pic: ${avatarFormatted}`,
            `ban: ${banFormatted}`,
            `shield: ${shieldFormatted}`,
            `burning: ${fireFormatted}`,
            `id: ${playerId}`,
        ];

        return {
            playerId,
            allianceId,
            allianceName,
            allianceTag,
            banEndTime,
            level,
            worldId,
            showCareerId,
            power,

            flagId,
            gender,
            avatar,
            name,
            nameLowercase: name.toLowerCase(),

            x,
            y,
            serverId,
            locationId,
            locationType,

            plateId,
            sBNum,
            shieldTime,
            fireTime,
            castleEffectId,
            skinId,
            language,
            sml,
            province,
            sskin,
            fireState,
            aid,
            countryRank,
            sBId,

            formatted,

            playerInfoResponse,
            playerPosInfoResponse,
        };
    }

    protected async showPlayerInfoByRank(msg: Discord.Message, playerRank: number): Promise<void> {
        if (!this.state) throw Error('no state');

        const { game } = this.state;
        const { reporter } = game;

        reporter(`searching for player with rank #${playerRank}`);

        const PAGE_SIZE = 30;
        const rankIndex = playerRank - 1;
        const offsetFrom = rankIndex - rankIndex % 30;
        const offsetTo = offsetFrom + PAGE_SIZE - 1;

        const topPlayersInfo = await game.getTopPlayers({ offsetFrom, offsetTo });

        let foundPlayerId: number = 0;

        for (let i = 0, index = offsetFrom; i < topPlayersInfo.list.length; ++i, ++index) {
            const info = topPlayersInfo.list[i];
            const playerId = Number(info.uid);
            const playerInfo = JSON.parse(info.playerInfo);
            const playerName = playerInfo.username || playerInfo.nickname;

            if (index === rankIndex) {
                foundPlayerId = playerId;
            }

            this.indexPlayer(playerId, playerName); // async but we will not wait
        }

        if (foundPlayerId) {
            reporter(`player rank #${playerRank} id found: ${foundPlayerId}`);
            await this.showPlayerInfoById(msg, foundPlayerId);
        } else {
            reporter(`rank #${playerRank} not found`, true);
        }
    }

    protected async indexPlayer(playerId: number, playerName: string): Promise<void> {
        if (!this.state) throw Error('no state');

        const { game, mongo } = this.state;
        const { reporter } = game;

        if (!playerId || !playerName) {
            return reporter(`indexPlayer failed: id=${playerId} name=${playerName}`);
        }

        await mongo.collections.players.updateOne({
            playerId: Number(playerId),
        }, {
            $set: {
                playerId: Number(playerId),
                name: playerName,
                nameLowercase: playerName.toLowerCase(),
                lastUpdate: new Date,
            },
        }, {
            upsert: true,
        });
    }

    protected async showPlayerInfoByName(msg: Discord.Message, playerName: string): Promise<void> {
        if (!this.state) throw Error('no state');

        const { game, mongo } = this.state;
        const { reporter } = game;

        reporter(`searching for player with name "${playerName}"`);

        const player = await mongo.collections.players.findOne({
            nameLowercase: playerName.toLowerCase(),
        });

        const foundPlayerId = player?.playerId;

        if (foundPlayerId) {
            reporter(`player "${playerName}" id found: ${foundPlayerId}`);
            await this.showPlayerInfoById(msg, foundPlayerId);
        } else {
            reporter(`player "${playerName}" not indexed yet. try asking by rank: \`find top 12\``, true);
        }
    }

    protected async createGameBot(mongoState: MongoState): Promise<GameBot> {
        const { config } = this;

        const cookieJar = new CookieJar({
            storageType: CookieJarStorageType.MONGO_DB,
            storageConfig: {
                collection: mongoState.collections.cookies,
                docId: 'discord',
            },
        });

        await cookieJar.loadFromStorage();

        return new GameBot(config, {
            userAgent: config.browser.userAgent,
            cookieJar,
            gp_token: config.discord.gameAccount.gp_token,
        });
    }

    protected async connectToDiscord(): Promise<DiscordState> {
        const { log, config } = this;

        log('connecting to discord ...');

        const client = new Discord.Client;
        await client.login(config.discord.app.bot.token);

        return {
            client,
        };
    }
}
