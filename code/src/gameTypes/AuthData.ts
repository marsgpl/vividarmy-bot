import { Building } from './Building';
import { Item } from './Item';
import { PlayerInfo } from './PlayerInfo';
import { Resources } from './Resources';
import { Science } from './Science';
import { Unit } from './Unit';

export interface AuthData {
    username: string; // "GG123"
    gameUid: number; // 318442242650
    serverTime: number; // 1602338565
    forceConfigVer: string; // "1.2.5792"
    deviceId: string; // "GHHTHUDT"
    chatChannel: string; // "country_602"
    userInfo: PlayerInfo;
    resource: Resources;
    items: Item[];
    armys: Unit[];
    sciences: Science[];
    buildings: Building[];
    star: number; // star=power
    regTime: number; // 1602713063
    registk: number; // 602
    currk: number; // 602
    k: number; // 601
    level: number; // 5
    exp: number; // 4080
    regAppVersion: string; // "1.124.2"
    regCountry: string; // "JP"
    refugee_camp: number; // 0
    refugee_camp_join: number; // 0
    rally_boss_join: number; // 0
    rally_boss_reward: number; // 0
    randomHeroTalentTodayNum: number; // 0
    nationalFlag: number; // 114
    treasureChapter: {
        chapterId: number; // 1
        finished: number; // 0
        stage: number; // 0
    };
    timeReward: {
        rewardTime: number; // 1602713063
        times: number; // 0
    };
    dailyQuest: {
        box1: number; // 0
        box2: number; // 0
        box3: number; // 0
        box4: number; // 0
        dailyQuestFinishCount: number; // 0
        dailyQuestFreeRefreshCount: number; // 0
        dailyQuests: [];
        nextRewardTime: number; // 1602777600
    };
}
