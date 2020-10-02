import Discord from 'discord.js';

import { DiscordBot } from 'DiscordBot';

import savePlayerInfoToMongo from 'discordCommands/savePlayerInfoToMongo';
import connectToGameWS from 'gameCommands/connectToGameWS';
import getPlayerInfo from 'gameCommands/getPlayerInfo';
import getPlayerPosInfo from 'gameCommands/getPlayerPosInfo';
import formatPlayerInfo from 'gameCommands/formatPlayerInfo';
import getTopPlayers from 'gameCommands/getTopPlayers';

const USAGE = [
    'How to use:',
        '`find DoomStar`',
        '`find rank 1`',
        '`find 316401955417`',
].join('\n    ');

export default async function(bot: DiscordBot, msg: Discord.Message): Promise<void> {
    if (!bot.state) throw Error('no state');

    const reporter = bot.state.game.reporter;

    const [, playerNameOrIdOrRank] = msg.content.match(/^[a-z]+\s+(.*)$/i) || [];

    if (!playerNameOrIdOrRank) {
        msg.reply(USAGE);
        return;
    }

    const [, uid] = playerNameOrIdOrRank.match(/^([0-9]{9,})$/i) || [];
    const [,, rank] = playerNameOrIdOrRank.match(/^(rank|top)\s+([0-9]+)$/i) || [];
    const name = !uid && !rank && playerNameOrIdOrRank;

    if (uid) {
        reporter(`searching for player with uid=${uid}`);

        await connectToGameWS(bot);

        const playerInfoResponse = await getPlayerInfo(bot, { uid });
        const playerPosInfoResponse = await getPlayerPosInfo(bot, { uid });

        await onInfoReceived(bot, msg, playerInfoResponse, playerPosInfoResponse);
    } else if (rank) {
        reporter(`searching for player with rank #${rank}`);

        await connectToGameWS(bot);

        const RATING_REQUEST_WINDOW_SIZE = 30;
        const rankTranslated = Number(rank) - 1;

        const offsetFrom = rankTranslated - rankTranslated % 30;
        const offsetTo = offsetFrom + RATING_REQUEST_WINDOW_SIZE - 1;

        msg.channel.send(`requesting top scrore ${offsetFrom} -> ${offsetTo}`);

        const topPlayersResponse = await getTopPlayers(bot, offsetFrom, offsetTo);

        let pos = offsetFrom;
        let uid: string = '';

        topPlayersResponse.list.forEach((entry: any) => {
            if (pos === rankTranslated) {
                const playerInfo = formatPlayerInfo(entry);
                uid = playerInfo.uid;
                reporter(`player rank #${rank} uid found: ${uid}`);
            }

            pos++;
        });

        if (!uid) {
            msg.reply(`rank #${rank} not found`);
            return;
        }

        const playerInfoResponse = await getPlayerInfo(bot, { uid });
        const playerPosInfoResponse = await getPlayerPosInfo(bot, { uid });

        await onInfoReceived(bot, msg, playerInfoResponse, playerPosInfoResponse);

        // silently index the rest

        const players = bot.state.mongo.collections.players;

        topPlayersResponse.list.forEach(async (entry: any) => {
            const { uid, name } = formatPlayerInfo(entry);
            if (!uid || !name) return;

            const doc = await players.findOne({ uid });
            if (doc) return;

            await players.insertOne({ uid, name });
        });
    } else if (name) { // name
        reporter(`searching for player with name "${name}"`);

        const r = await bot.state.mongo.collections.players.findOne({
            name,
        });

        const uid = r?.uid;

        if (!uid) {
            msg.reply(`player name "${name}" not indexed yet. try asking by rank: \`find rank 5\``);
            return;
        }

        reporter(`player "${name}" uid found: ${uid}`);

        await connectToGameWS(bot);

        const playerInfoResponse = await getPlayerInfo(bot, { uid });
        const playerPosInfoResponse = await getPlayerPosInfo(bot, { uid });

        await onInfoReceived(bot, msg, playerInfoResponse, playerPosInfoResponse);
    } else {
        throw Error('no options available for input');
    }
}

async function onInfoReceived(
    bot: DiscordBot,
    msg: Discord.Message,
    playerInfoResponse: {[key: string]: any},
    playerPosInfoResponse: {[key: string]: any},
): Promise<void> {
    if (!bot.state) throw Error('no state');

    const playerInfo = formatPlayerInfo(playerInfoResponse, playerPosInfoResponse);

    await savePlayerInfoToMongo(bot, msg, playerInfo);

    msg.reply(`here is your order:\n    ${playerInfo.formatted.join('\n    ')}`);
}
