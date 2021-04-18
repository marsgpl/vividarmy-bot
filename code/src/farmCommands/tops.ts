import { Farm } from 'class/Farm';
import getAllTopServerPlayers from 'gameCommands/getAllTopServerPlayers';
import getExistingServers from 'gameCommands/getExistingServers';
import asyncForeach from 'modules/asyncForeach';

export default async function(this: Farm): Promise<void> {
    const puppetId = process.argv[3];
    const puppet = await this.getPuppetById(puppetId);

    const g123UserId = await puppet.gameBot.getG123UserId();

    const servers = await getExistingServers(puppet.gameBot);
console.log('🔸 servers:', servers);
process.exit(1);
    await asyncForeach(servers, async server => {
        const players = await getAllTopServerPlayers(puppet.gameBot, {
            serverId: server.serverId,
        });

        players.forEach(player => {
            player.playerInfo = JSON.parse(player.playerInfo as unknown as string);
            console.log(JSON.stringify(player));
        });
    });
}
