import { DiscordBot } from 'DiscordBot';

import disconnectFromGameWs from 'gameCommands/disconnectFromGameWs';

export default function(bot: DiscordBot): void {
    if (!bot.state) throw Error('no state');

    const reporter = bot.state.game.reporter;
    const { config, state } = bot;
    const { game } = state;

    game.gameWsInactivityTimeout && clearTimeout(game.gameWsInactivityTimeout);

    game.gameWsInactivityTimeout = setTimeout(() => {
        reporter('inactivity 10 minutes');
        disconnectFromGameWs(bot);
        game.gameWsInactivityTimeout = undefined;
    }, 10 * 60 * 1000);
}
