import Discord from 'discord.js';

import { DiscordBot } from 'class/DiscordBot';
import createPlayerFromInfo from 'helpers/createPlayerFromInfo';
import getPlayerLocalInfo from 'gameCommands/getPlayerLocalInfo';
import getPlayerPointInfo from 'gameCommands/getPlayerPointInfo';

const USAGE = [
    'how to use:',
        'find Swenor',
        'find top 1',
        'find top 1 s631',
        `find 316401955417`, // G123
].join('\n    ');

const REGEXP_FIND_BY_ID = /^find\s+([0-9]{9,})$/i;
const REGEXP_FIND_BY_TOP_POS = /^find\s+(top|rank)\s*([0-9]+)(\s+s?([0-9]+))?$/i;
const REGEXP_FIND_BY_NAME = /^find\s+(.+)(\s+s?([0-9]+))?$/i;

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

async function findById(
    this: DiscordBot,
    message: Discord.Message,
    playerId: string,
): Promise<void> {
    const { state } = this;

    message.channel.send(`searching for player: {id: ${playerId}} ...`);

    if (!state) throw Error('no state');

    const playerLocalInfo = await getPlayerLocalInfo(state.game, { playerId });
    const playerPointInfo = await getPlayerPointInfo(state.game, { playerId });

    const player = createPlayerFromInfo({
        playerLocalInfo,
        playerPointInfo,
    });

    if (!player) {
        throw Error(`player info not found`);
    }

    message.reply(`\`${message.content}\`:\n    ${player.formatted?.join('\n    ')}`);

    await this.indexPlayer(player);
}

async function findByTopPos(
    this: DiscordBot,
    message: Discord.Message,
    playerTopPos: number,
    serverId?: number,
): Promise<void> {
    const { state } = this;
    if (!state) throw Error('no state');

    serverId = serverId || await state.game.getCurrentServerId();

    message.channel.send(`searching for player: {rank: ${playerTopPos}, server: ${serverId}} ...`);

    throw Error('TODO: findByTopPos');
}

async function findByName(
    this: DiscordBot,
    message: Discord.Message,
    playerName: string,
    serverId?: number,
): Promise<void> {
    const { state } = this;
    if (!state) throw Error('no state');

    serverId = serverId || await state.game.getCurrentServerId();

    message.channel.send(`searching for player: {name: ${playerName}, server: ${serverId}} ...`);

    const player = await this.findPlayerInMongo(playerName, serverId);
    const playerId = player?.playerId;

    if (playerId) {
        message.channel.send(`${playerName}'s id found: ${playerId}`);
        await findById.call(this, message, playerId);
    } else {
        message.reply(`${playerName} is not indexed yet. try asking by rank: \`find top 12\``);
    }
}
