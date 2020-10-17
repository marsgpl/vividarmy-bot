import { Farm } from 'class/Farm';

export default async function(this: Farm): Promise<void> {
    const commandName = process.argv[3];
    const puppetIdFrom = Number(process.argv[4]) || 0;
    const puppetIdTo = Number(process.argv[5]) || puppetIdFrom;

    if (!commandName) {
        throw Error(`unable to get subcommand name from args for command 'all'`);
    }

    if (commandName.toLowerCase() === 'all') {
        throw Error(`name 'all' can't be a subcommand`);
    }

    if (puppetIdFrom < 1) {
        throw Error(`puppetIdFrom is invalid`);
    }

    if (puppetIdTo < puppetIdFrom) {
        throw Error(`puppetIdTo must be >= puppetIdFrom`);
    }

    const command = this.getCommandByName(commandName);

    if (!command) {
        throw Error(`unknown subcommand: ${commandName}`);
    }

    for (let puppetIndex = puppetIdFrom; puppetIndex <= puppetIdTo; ++puppetIndex) {
        try {
            process.argv[3] = String(puppetIndex);
            process.argv[4] = process.argv[6];
            process.argv[5] = process.argv[7];
            process.argv[6] = process.argv[8];
            process.argv[7] = process.argv[9];
            await command.call(this);
        }  catch (error) {
            this.log(`subcommand failed: ${commandName}`);
            // throw error;
        }

        this.lastPuppet?.disconnectFromGame();
    }
}
