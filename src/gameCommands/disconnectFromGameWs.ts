import { DiscordBot } from 'DiscordBot';

export default async function(bot: DiscordBot): Promise<void> {
    if (!bot.state) throw Error('no state');

    const { config, state } = bot;
    const { game } = state;
    const reporter = game.reporter;

    if (!game.gameWs) return;
    if (!game.connected) return;

    game.gameWs.close();
    game.gameWsPingItv && clearInterval(game.gameWsPingItv);
    game.gameWsPingItv = undefined;
    game.gameWsInactivityTimeout && clearTimeout(game.gameWsInactivityTimeout);
    game.gameWsInactivityTimeout = undefined;
    game.connected = false;

    reporter('disconnected from game');
}
