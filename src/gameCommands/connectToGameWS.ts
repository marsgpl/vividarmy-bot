import { DiscordBot } from 'DiscordBot';

import checkProxy from 'gameCommands/checkProxy';
import getClientVersion from 'gameCommands/getClientVersion';
import getServerInfo from 'gameCommands/getServerInfo';
import openWs from 'gameCommands/openWs';
import * as GAME_WS_FIELDS from 'constants/gameWsFields';
import * as GAME_WS_COMMANDS from 'constants/gameWsCommands';
import resetGameWsInactivityTimeout from 'gameCommands/resetGameWsInactivityTimeout';

export default async function(bot: DiscordBot): Promise<void> {
    if (!bot.state) throw Error('no state');

    const reporter = bot.state.game.reporter;
    const { config, state } = bot;
    const { game } = state;

    if (game.connected) {
        return;
    }

    reporter('connecting to game ...');

    if (game.connecting) {
        throw Error('unable to connect to game: already connecting to game. try again later');
    }

    game.connecting = true;

    if (config.game.checkProxy.required) {
        try {
            await checkProxy(bot);
        } catch (error) {
            game.connecting = false;
            throw error;
        }
    }

    try {
        await getClientVersion(bot);
    } catch (error) {
        game.connecting = false;
        throw error;
    }

    try {
        await getServerInfo(bot);
    } catch (error) {
        game.connecting = false;
        throw error;
    }

    try {
        await openWs(bot);
    } catch (error) {
        game.connecting = false;
        throw error;
    }

    game.connecting = false;
    game.connected = true;

    game.gameWsPingItv && clearInterval(game.gameWsPingItv);
    game.gameWsPingItv = setInterval(() => {
        if (!game.connected) return;
        if (!game.gameWs) return;

        const packet = {
            [GAME_WS_FIELDS.COMMAND]: GAME_WS_COMMANDS.PING,
            [GAME_WS_FIELDS.PACKET_INDEX]: String(game.gameWsNextPacketIndex++),
            [GAME_WS_FIELDS.OUTCOMING_PAYLOAD]: {},
        };

        game.gameWsSend(packet);
    }, 11000);

    resetGameWsInactivityTimeout(bot);

    // @TODO send initial data requests here
}
