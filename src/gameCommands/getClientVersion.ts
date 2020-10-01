import { DiscordBot } from 'DiscordBot';

// 1.120.0|NO_FORCE_UPDATE

export default async function(bot: DiscordBot): Promise<void> {
    if (!bot.state) throw Error('no state');

    const reporter = bot.state.game.reporter;
    const config = bot.config;
    const browser = bot.state.browser;

    const getClientVersionUrl = config.game.urls.getClientVersion
        .replace(':ts:', String(Date.now()));

    const r = await browser.get(getClientVersionUrl, {}, {
        referer: config.game.urls.getClientVersion_referer,
    });

    const [value, notes] = r.body.split('|');

    if (!value) {
        throw Error(`expected: x.xxx.x|status; received: ${r.body}`);
    }

    bot.state.game.clientVersion = value;

    reporter(`client version: ${value} ${(notes||'').trim()}`);
}
