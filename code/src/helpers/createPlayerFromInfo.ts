import { PlayerInfo } from 'gameTypes/PlayerInfo';
import { PlayerLocalInfo } from 'gameTypes/PlayerLocalInfo';
import { PlayerPointInfo } from 'gameTypes/PlayerPointInfo';
import { TopLocalPlayer } from 'gameTypes/TopLocalPlayer';
import { TopServerPlayer } from 'gameTypes/TopServerPlayer';
import { Player } from 'localTypes/Player';

export default function({
    currentServerId,
    currentServerTime,
    playerLocalInfo,
    playerPointInfo,
    topLocalPlayer,
    topServerPlayer,
}: {
    currentServerId?: number,
    currentServerTime?: number;
    playerLocalInfo?: PlayerLocalInfo | null,
    playerPointInfo?: PlayerPointInfo | null,
    topLocalPlayer?: TopLocalPlayer | null,
    topServerPlayer?: TopServerPlayer | null,
}): Player | null {
    let playerId: string = '';
    let serverId: number = 0;
    let name: string = '';

    const point = playerPointInfo?.p;

    let playerInfo: PlayerInfo | null =
        playerLocalInfo?.playerInfo ||
        point?.playerInfo ||
        topLocalPlayer?.playerInfo ||
        topServerPlayer?.playerInfo ||
        null;

    if (playerLocalInfo?.uid) {
        playerId = playerLocalInfo.uid;
        serverId = currentServerId || serverId;
    }

    if (point) {
        playerId = playerId || String(point.pid);
        serverId = playerPointInfo?.k || point.w || serverId;
    }

    if (topServerPlayer?.uid) {
        playerId = playerId || topServerPlayer.uid;
        serverId = topServerPlayer.serverId;
    }

    if (topLocalPlayer?.uid) {
        playerId = playerId || topLocalPlayer.uid;
        serverId = currentServerId || serverId;
    }

    if (playerInfo) {
        name = playerInfo.nickname || playerInfo.username;
    }

    if (!playerId || !serverId || !name) {
        return null;
    }

    const banEndTime = playerLocalInfo?.banEndTime || 0;
    const shieldEndTime = point?.shieldTime || 0;
    const burnEndTime = point?.fireTime || 0;

    const formatted = {
        allianceTag: playerLocalInfo?.allianceTag || point?.a_tag,
        allianceName: playerLocalInfo?.allianceName,
        allianceId: playerLocalInfo?.allianceId || point?.aid,
        level:
            playerLocalInfo?.level ||
            point?.level ||
            topServerPlayer?.lv,
        power:
            playerLocalInfo?.power ||
            point?.power ||
            topServerPlayer?.val ||
            topServerPlayer?.power ||
            topLocalPlayer?.power,
        posX: playerPointInfo?.x,
        posY: playerPointInfo?.y,
        gender: playerInfo?.gender || playerInfo?.usergender,
        locale: point?.language,
        avatar:
            playerInfo?.headimgurl_custom ||
            playerInfo?.headimgurl ||
            playerInfo?.avatarurl,
        flagId: playerInfo?.nationalflag,
        banSecondsLeft: currentServerTime ? banEndTime - currentServerTime : -1,
        shieldSecondsLeft: currentServerTime ? shieldEndTime - currentServerTime : -1,
        burnSecondsLeft: currentServerTime ? burnEndTime - currentServerTime : -1,
    };

    return {
        lastUpdate: new Date,

        playerId,
        serverId,
        name,
        nameLowercase: name.toLowerCase(),

        formatted,

        playerLocalInfo,
        playerPointInfo,
        currentServerId,
        currentServerTime,
    };
}
