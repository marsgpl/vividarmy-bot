import Discord from 'discord.js';

import { DiscordBot } from 'class/DiscordBot';
import createPlayerFromInfo from 'helpers/createPlayerFromInfo';
import getPlayerLocalInfo from 'gameCommands/getPlayerLocalInfo';
import getPlayerPointInfo from 'gameCommands/getPlayerPointInfo';
import printFormattedPlayerInfo from 'helpers/printFormattedPlayerInfo';
import getTopLocalPlayer from 'gameCommands/getTopLocalPlayer';
import getTopServerPlayer from 'gameCommands/getTopServerPlayer';
import { GameBot } from 'class/GameBot';
import { Player } from 'localTypes/Player';

const USAGE = [
    'how to use:',
        'find swenor',
        'find oddlot s602',
        'find top 1',
        'find top 1 s602',
        `find 316401955417`, // G123
].join('\n    ');

const REGEXP_FIND_BY_ID = /^find\s+([0-9]{9,})$/i;
const REGEXP_FIND_BY_TOP_POS = /^find\s+(top|rank)\s*([0-9]+)(\s+s?([0-9]+))?$/i;
const REGEXP_FIND_BY_NAME = /^find\s+(.+?)(\s+s?([0-9]+))?$/i;

export default async function(
    this: DiscordBot,
    message: Discord.Message,
    isUserAdmin: boolean,
): Promise<void> {
    let m: RegExpMatchArray | null;

    if (m = message.content.match(REGEXP_FIND_BY_ID)) {
        const [, playerId] = m;
        await findById.call(this, message, playerId);
    } else if (m = message.content.match(REGEXP_FIND_BY_TOP_POS)) {
        const [,, playerTopPos,, serverId] = m;
        await findByTopPos.call(this, message, Number(playerTopPos), Number(serverId));
    } else if (m = message.content.match(REGEXP_FIND_BY_NAME)) {
        const [, playerName,, serverId] = m;
        await findByName.call(this, message, playerName, Number(serverId));
    } else {
        throw Error(USAGE);
    }
}

async function findPlayerOnServerById(
    bot: GameBot,
    playerId: string,
): Promise<Player | null> {
    const currentServerId = await bot.getCurrentServerId();
    const playerLocalInfo = await getPlayerLocalInfo(bot, { playerId });
    const playerPointInfo = await getPlayerPointInfo(bot, { playerId });
    const currentServerTime = await bot.getCurrentServerTime(); // must be called last

    return createPlayerFromInfo({
        currentServerId,
        currentServerTime,
        playerLocalInfo,
        playerPointInfo,
    });
}

async function findById(
    this: DiscordBot,
    message: Discord.Message,
    playerId: string,
): Promise<void> {
    const { state } = this;

    if (playerId.length < 9 || playerId.length > 15) {
        throw Error(`invalid playerId: ${playerId}`);
    }

    message.channel.send(`searching for player: {id: ${playerId}}`);

    let player = await findPlayerOnServerById(state.game, playerId);

    player = player?.formatted.posX ? player :
        await findPlayerOnServerById(state.gameSvS, playerId);

    if (!player) {
        throw Error(`player info not found`);
    }

    message.reply(`\`${message.content}\`:\n${printFormattedPlayerInfo(player, '    ')}`);

    await this.indexPlayer(player);
}

async function findByTopPos(
    this: DiscordBot,
    message: Discord.Message,
    playerTopPos: number,
    serverId?: number,
): Promise<void> {
    const { state } = this;

    if (playerTopPos < 1 || playerTopPos > 99999) {
        throw Error(`invalid playerTopPos: ${playerTopPos}`);
    }

    if (serverId !== undefined && (serverId < 0 || serverId > 9999)) {
        throw Error(`invalid serverId: ${serverId}`);
    }

    let playerId: string = '';

    const currentServerId = await state.game.getCurrentServerId();
    const currentServerIdSvS = await state.gameSvS.getCurrentServerId();

    if (!serverId) {
        serverId = currentServerId;
    }

    if (serverId === currentServerId) {
        const topLocalPlayer = await getTopLocalPlayer(state.game, { rank: playerTopPos });
        playerId = topLocalPlayer?.uid || '';
    } else if (serverId === currentServerIdSvS) {
        const topLocalPlayer = await getTopLocalPlayer(state.gameSvS, { rank: playerTopPos });
        playerId = topLocalPlayer?.uid || '';
    } else { // global
        const topServerPlayer = await getTopServerPlayer(state.game, { serverId, rank: playerTopPos });

        if (topServerPlayer?.uid) {
            const player = createPlayerFromInfo({ topServerPlayer });

            if (player) {
                message.reply(`\`${message.content}\`:\n${printFormattedPlayerInfo(player, '    ')}`);
                return;
            }
        }
    }

    if (!playerId) {
        throw Error(`top player not found`);
    }

    message.channel.send(`player id found: ${playerId}`);

    await findById.call(this, message, playerId);
}

async function findByName(
    this: DiscordBot,
    message: Discord.Message,
    playerName: string,
    serverId?: number,
): Promise<void> {
    const { state } = this;

    serverId = serverId || await state.game.getCurrentServerId();

    message.channel.send(`searching for player: {name: ${playerName}, server: ${serverId}}`);

    const player = await this.findPlayerInMongo(playerName, serverId);
    const playerId = player?.playerId;

    if (playerId) {
        // message.channel.send(`${playerName}'s id found: ${playerId}`);
        await findById.call(this, message, playerId);
    } else {
        message.reply(`${playerName} is not indexed yet. try asking by rank: \`find top 12\``);
    }
}
