var dev_json_1 = require('config/dev.json');
var Farm_1 = require('class/Farm');
process.on('unhandledRejection', function (reason) {
    console.log('Farm unhandledRejection:', reason);
    process.exit(1);
});
process.on('uncaughtException', function (reason) {
    console.log('Farm uncaughtException:', reason);
    process.exit(1);
});
process.on('SIGTERM', function () {
    console.log('Farm SIGTERM');
    process.exit(1);
});
var farm = new Farm_1.Farm(dev_json_1["default"], as, Config);
farm.start();
