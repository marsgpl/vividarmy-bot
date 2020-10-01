import { DiscordBot } from 'DiscordBot';
import * as GAME_WS_FIELDS from 'constants/gameWsFields';
import * as GAME_WS_COMMANDS from 'constants/gameWsCommands';

// {"c":630,"o":"236","p":{"uid":"307176813145"}}
// {"c":630,"s":0,"d":"{\"allianceId\":100067575,\"uid\":\"307176813145\",\"banEndTime\":0,\"allianceTag\":\"CKD\",\"level\":74,\"worldId\":27,\"showCareerId\":1002702,\"playerInfo\":\"{\\\"nationalflag\\\":167,\\\"gender\\\":0,\\\"avatarurl\\\":\\\"\\\",\\\"nickname\\\":null,\\\"headimgurl\\\":null,\\\"usergender\\\":1,\\\"headimgurl_custom\\\":\\\"https://knight-cdn.akamaized.net/headimg/307176813145.jpg?v=1599590746605\\\",\\\"username\\\":\\\"Swenor\\\"}\",\"allianceName\":\"CobraKaiDojo\",\"power\":1.787550122977677E27}","o":"236"}

export interface Options {
    uid: string;
}

export default function(bot: DiscordBot, options: Options): Promise<any> { return new Promise((resolve, reject) => {
    if (!bot.state) throw Error('no state');

    const { config, state } = bot;
    const { game } = state;

    if (!game.gameWs) throw Error('no gameWs');

    const packet = {
        [GAME_WS_FIELDS.COMMAND]: GAME_WS_COMMANDS.GET_PLAYER_INFO,
        [GAME_WS_FIELDS.PACKET_INDEX]: String(game.gameWsNextPacketIndex++),
        [GAME_WS_FIELDS.OUTCOMING_PAYLOAD]: {
            uid: options.uid,
        },
    };

    game.gameWsSend(packet, async (bot, payload) => {
        resolve(payload);
    });
}); }
