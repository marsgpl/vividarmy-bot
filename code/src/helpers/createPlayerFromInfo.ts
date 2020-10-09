import { PlayerLocalInfo } from 'gameTypes/PlayerLocalInfo';
import { PlayerPointInfo } from 'gameTypes/PlayerPointInfo';
import { Player } from 'localTypes/Player';

export default function({
    playerLocalInfo,
    playerPointInfo,
}: {
    playerLocalInfo: PlayerLocalInfo | null,
    playerPointInfo: PlayerPointInfo | null,
}): Player | null {
    const formatted: string[] = [];

    console.log('🔸 playerLocalInfo:', playerLocalInfo);
    console.log('🔸 playerPointInfo:', playerPointInfo);

    return {
        _id: '',
        playerId: '',
        serverId: 0,
        name: '',
        nameLowercase: '',
        formatted,
    };
}
