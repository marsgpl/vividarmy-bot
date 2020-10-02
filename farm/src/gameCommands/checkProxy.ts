import { DiscordBot } from 'DiscordBot';

export default async function(bot: DiscordBot): Promise<void> {
    if (!bot.state) throw Error('no state');

    const reporter = bot.state.game.reporter;
    const config = bot.config;
    const browser = bot.state.browser;

    const r = await browser.get(config.game.checkProxy.url);

    const expected = JSON.stringify(config.game.checkProxy.expectedAnswer);
    const received = JSON.stringify(r.body);

    if (received !== expected) {
        throw Error(`expected: ${expected}; received: ${received}`);
    }

    reporter('proxy: OK');
}
