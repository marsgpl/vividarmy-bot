import { GameBot } from 'class/GameBot';

// {"c":816,"o":"123","p":{"scienceId":320006,"gold":0}}

// {"c":816,"s":0,"d":"{\"science\":{\"scienceId\":320006,\"group\":320000}}","o":"123"}

export default async function(game: GameBot, {
    scienceId,
}: {
    scienceId: number;
}): Promise<boolean> {
    const r = await game.wsRPC(816, {
        scienceId: Number(scienceId),
        gold: 0,
    });

    if (r?.science?.scienceId !== scienceId) {
        game.reporter(`researchScience failed: ${JSON.stringify(r)}`);
        return false;
    }

    game.updateScience(r.science);

    game.reporter(`science researched: ${scienceId}`);
    return true;
}

// @TODO async
// {"c":10021,"s":0,"d":"{\"syncTime\":1602768491,\"restorePoint\":1,\"reason\":\"upgrade_level\",\"buyTimes\":0,\"type\":1,\"pointMax\":50,\"point\":50,\"restoreSec\":360}","o":null}
// {"c":10401,"s":0,"d":"{\"itemId\":320001,\"amount\":2}","o":null}
