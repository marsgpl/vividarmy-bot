import { GameBot } from 'class/GameBot';
import { TopLocalPlayer } from 'gameTypes/TopLocalPlayer';
import getTopLocalPlayers from './getTopLocalPlayers';

const PLAYERS_PER_REQUEST = 30;

export default async function(game: GameBot, options: {
    rank: number;
}): Promise<TopLocalPlayer | null> {
    const rankIndex = options.rank - 1;
    const offsetFrom = rankIndex - rankIndex % PLAYERS_PER_REQUEST;
    const offsetTo = offsetFrom + PLAYERS_PER_REQUEST - 1;
    const indexInResponse = rankIndex - offsetFrom;

    const players = await getTopLocalPlayers(game, { offsetFrom, offsetTo });

    const player = players?.[indexInResponse];

    if (!player) {
        game.reporter(`getTopLocalPlayer fail`);
        return null;
    }

    return player;
}
