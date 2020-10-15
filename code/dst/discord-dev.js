var dev_json_1 = require('config/dev.json');
var DiscordBot_1 = require('class/DiscordBot');
process.on('unhandledRejection', function (reason) {
    console.log('DiscordBot unhandledRejection:', reason);
    process.exit(1);
});
process.on('uncaughtException', function (reason) {
    console.log('DiscordBot uncaughtException:', reason);
    process.exit(1);
});
process.on('SIGTERM', function () {
    console.log('DiscordBot SIGTERM');
    process.exit(1);
});
var discordBot = new DiscordBot_1.DiscordBot(dev_json_1["default"], as, Config);
discordBot.start();
