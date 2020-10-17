import { GameBot } from 'class/GameBot';
import unique from 'modules/unique';

// {"c":857,"o":"87","p":{"targetUID":"318441984602"}}

// {"c":857,"s":0,"d":"{\"result\":0,\"targetUID\":318441984602}","o":"87"}

const COMMAND_ID = unique(857);

export default async function(game: GameBot, {
    accountId,
}: {
    accountId: string;
}): Promise<void> {
    const r = await game.wsRPC(COMMAND_ID, {
        targetUID: String(accountId),
    });

    if (String(r?.targetUID) !== accountId) {
        throw Error(`deleteAccount failed: ${JSON.stringify(r)}`);
    }

    game.reporter(`account id=${accountId} deleted`);
}
