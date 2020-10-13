import { PlayerLocalInfo } from 'gameTypes/PlayerLocalInfo';
import { PlayerPointInfo } from 'gameTypes/PlayerPointInfo';
import { TopLocalPlayer } from 'gameTypes/TopLocalPlayer';
import { TopServerPlayer } from 'gameTypes/TopServerPlayer';

export interface Player {
    // _id: string;
    lastUpdate: Date;

    playerId: string;
    serverId: number;
    name: string;
    nameLowercase: string;

    formatted: {
        allianceTag?: string;
        allianceName?: string;
        allianceId?: number;
        level?: number;
        power?: number;
        posX?: number;
        posY?: number;
        gender?: number;
        locale?: string;
        avatar?: string;
        flagId?: number;
        banSecondsLeft: number;
        shieldSecondsLeft: number;
        burnSecondsLeft: number;
    };

    currentServerId?: number;
    currentServerTime?: number;

    playerLocalInfo?: PlayerLocalInfo | null,
    playerPointInfo?: PlayerPointInfo | null,
    topServerPlayer?: TopServerPlayer | null;
    topLocalPlayer?: TopLocalPlayer | null;
}
