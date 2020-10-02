import Discord from 'discord.js';

import { DiscordBot } from 'DiscordBot';

export default async function(
    bot: DiscordBot,
    msg: Discord.Message,
    playerInfo: {[key: string]: any},
): Promise<void> {
    if (!bot.state) throw Error('no state');
    if (!playerInfo.uid) throw Error('no uid');

    await bot.state.mongo.collections.players.updateOne({
        uid: playerInfo.uid,
    }, {
        $set: {
            lastUpdate: new Date,
            ...playerInfo,
        },
    }, {
        upsert: true,
    });
}
