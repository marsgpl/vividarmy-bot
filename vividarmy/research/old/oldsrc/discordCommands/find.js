const isPlayerNameValid = require('gameModules/isPlayerNameValid');
const connectToGame = require('discordCommands/connectToGame');

module.exports = async state => {
    const { msg, args } = state.discord;

    if (!args) {
        return msg.channel.send('empty input');
    }

    const playerId = args.match(/^[1-9]{9,}$/);
    const playerName = playerId ? null : args;
    const targetTitle = playerName || `id:${playerId}`;

    if (playerName) {
        if (!isPlayerNameValid(playerName)) {
            return msg.channel.send(`invalid player name: ${targetTitle}`);
        }
    }

    msg.channel.send(`looking for ${targetTitle} ...`);

    const success = await connectToGame(state);
    if (!success) return;
};
