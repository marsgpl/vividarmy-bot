import Discord from 'discord.js';

import { DiscordBot } from 'class/DiscordBot';
import getTopLocalPlayers from 'gameCommands/getTopLocalPlayers';
import asyncForeach from 'modules/asyncForeach';
import createPlayerFromInfo from 'helpers/createPlayerFromInfo';
import { TopLocalPlayer } from 'gameTypes/TopLocalPlayer';

const USAGE = [
    'how to use:',
        'index 0 100',
        'index svs 0 100',
].join('\n    ');

const REGEXP_INDEX = /^index(\s+svs)?\s+(([0-9]+)[ -])?([0-9]+)$/i;

export default async function(
    this: DiscordBot,
    message: Discord.Message,
    isUserAdmin: boolean,
): Promise<void> {
    if (!isUserAdmin) {
        throw Error(`only bot admin can index`);
    }

    const [, isSvS,, offsetFrom, offsetTo] = message.content.match(REGEXP_INDEX) || [];

    if (!offsetTo) {
        throw Error(USAGE);
    }

    await index.call(this, message, Boolean(isSvS), Number(offsetFrom), Number(offsetTo));

    message.reply(`indexing done`);
}

async function index(
    this: DiscordBot,
    message: Discord.Message,
    isSvS: boolean,
    offsetFrom: number,
    offsetTo: number,
): Promise<void> {
    const { state } = this;

    if (offsetFrom < 0 || offsetFrom > offsetTo) {
        throw Error(`invalid offset: ${offsetFrom} -> ${offsetTo}`);
    }

    message.channel.send(`indexing ${isSvS ? 'svs' : 'local'} players: ${offsetFrom} -> ${offsetTo}`);

    const bot = isSvS ? state.gameSvS : state.game;
    const PAGE_SIZE = 30;
    let iteration = 0;

    const currentServerId = await bot.getCurrentServerId();

    while (offsetFrom < offsetTo) {
        iteration++;

        const to = offsetFrom + PAGE_SIZE - 1;

        if (iteration > 0 && (iteration === 1 || iteration % 10 === 0)) {
            message.channel.send(`indexing: ${offsetFrom} -> ${to}`);
        }

        const players = await getTopLocalPlayers(bot, {
            offsetFrom,
            offsetTo: to,
        });

        offsetFrom += PAGE_SIZE;

        if (!players) {
            throw Error(`indexing ${offsetFrom} -> ${to} failed`);
        }

        await asyncForeach<TopLocalPlayer>(players, async topLocalPlayer => {
            const player = createPlayerFromInfo({
                currentServerId,
                topLocalPlayer,
            });

            if (player) {
                await this.indexPlayer(player);
            }
        });
    }
}
