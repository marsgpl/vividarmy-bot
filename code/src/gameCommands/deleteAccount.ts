import { GameBot } from 'class/GameBot';

// {"c":857,"o":"87","p":{"targetUID":"318441984602"}}

// {"c":857,"s":0,"d":"{\"result\":0,\"targetUID\":318441984602}","o":"87"}

export default async function(game: GameBot, {
    accountId,
}: {
    accountId: string;
}): Promise<void> {
    const r = await game.wsRPC(857, {
        targetUID: String(accountId),
    });

    if (r?.targetUID != accountId) {
        throw Error(`failed: ${JSON.stringify(r)}`);
    }

    game.reporter(`account id=${accountId} deleted`);
}
