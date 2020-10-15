import { Farm } from 'class/Farm';

export default async function(this: Farm): Promise<void> {
    const commandName = process.argv[3];
    const puppetIdFrom = Number(process.argv[4]) || 0;
    const puppetIdTo = Number(process.argv[4]) || puppetIdFrom;

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
            await command.call(this);
        }  catch (error) {
            this.log(`subcommand failed: ${commandName}`);
        }
    }
}
