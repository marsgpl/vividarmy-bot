import { DiscordBot } from 'DiscordBot';
import * as GAME_WS_FIELDS from 'constants/gameWsFields';
import * as GAME_WS_COMMANDS from 'constants/gameWsCommands';

// {"c":909,"o":"236","p":{"targetId":"307176813145"}}
// {"c":909,"s":0,"d":"{\"point\":{\"p\":{\"plateId\":1,\"sBNum\":0,\"level\":74,\"shieldTime\":1601244890,\"fireTime\":0,\"playerInfo\":\"{\\\"nationalflag\\\":167,\\\"gender\\\":0,\\\"avatarurl\\\":\\\"\\\",\\\"nickname\\\":null,\\\"headimgurl\\\":null,\\\"usergender\\\":1,\\\"headimgurl_custom\\\":\\\"https://knight-cdn.akamaized.net/headimg/307176813145.jpg?v=1599590746605\\\",\\\"username\\\":\\\"Swenor\\\"}\",\"castleEffectId\":7,\"pid\":307176813145,\"skinId\":1710700,\"language\":\"en\",\"sml\":0,\"province\":27,\"w\":601,\"sskin\":0,\"power\":1.8420072763824053E27,\"fireState\":0,\"aid\":100067575,\"countryRank\":0,\"sBId\":0,\"a_tag\":\"CKD\"},\"x\":354,\"y\":450,\"k\":601,\"id\":115378,\"pointType\":1}}","o":"7"}

export interface Options {
    uid: string;
}

export default function(bot: DiscordBot, options: Options): Promise<any> { return new Promise((resolve, reject) => {
    if (!bot.state) throw Error('no state');

    const { config, state } = bot;
    const { game } = state;

    if (!game.gameWs) throw Error('no gameWs');

    const packet = {
        [GAME_WS_FIELDS.COMMAND]: GAME_WS_COMMANDS.GET_PLAYER_POS_INFO,
        [GAME_WS_FIELDS.PACKET_INDEX]: String(game.gameWsNextPacketIndex++),
        [GAME_WS_FIELDS.OUTCOMING_PAYLOAD]: {
            targetId: options.uid,
        },
    };

    game.gameWsSend(packet, async (bot, payload) => {
        resolve(payload);
    });
}); }
