import { AvailableServer } from './AvailableServer';
import { MyAccountOnServer } from './MyAccountOnServer';
import { PlayerInfo } from './PlayerInfo';

export interface AllServers {
    playerInfo: PlayerInfo;
    region: string; // "cn-beijing"
    serverList: MyAccountOnServer[];
    showServerList: {
        badDev: string; // "com.nmmpnjmfmemjmfji.lhs,com.xxlhsx.xx,com.angel.nrzs,com.cyjh.gundam"
        serverList: AvailableServer[];
    };
}
