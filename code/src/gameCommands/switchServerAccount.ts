import { GameBot } from 'class/GameBot';

// create new:

// {"c":848,"o":"263","p":{"serverId":602,"uid":"0","deviceType":"wxMiniProgram"}}

// {"c":848,"s":0,"d":"{\"uid\":0,\"region\":\"us-west-1\"}","o":"263"}

// switch to existing:

// {"c":848,"o":"299","p":{"serverId":720,"uid":"489051796176","deviceType":"wxMiniProgram"}}

// {"c":848,"s":0,"d":"{\"uid\":489051796176,\"region\":\"cn-beijing\"}","o":"299"}

export default async function(game: GameBot, {
    targetServerId,
    targetAccountId,
}: {
    targetServerId: number;
    targetAccountId: string;
}): Promise<void> {
    const r = await game.wsRPC(848, {
        serverId: Number(targetServerId),
        uid: targetAccountId || "0",
        deviceType: 'wxMiniProgram',
    });

    if (r?.uid != targetAccountId) {
        throw Error(`switchServerAccount fail: ${JSON.stringify(r)}`);
    }

    if (targetAccountId) {
        game.reporter(`switched to account id=${targetAccountId} on server ${targetServerId}`);
    } else {
        game.reporter(`created new account on server ${targetServerId}`);
    }
}
