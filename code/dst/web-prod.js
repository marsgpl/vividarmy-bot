var prod_json_1 = require('config/prod.json');
var Web_1 = require('class/Web');
process.on('unhandledRejection', function (reason) {
    console.log('Web unhandledRejection:', reason);
    process.exit(1);
});
process.on('uncaughtException', function (reason) {
    console.log('Web uncaughtException:', reason);
    process.exit(1);
});
process.on('SIGTERM', function () {
    console.log('Web SIGTERM');
    process.exit(1);
});
var web = new Web_1.Web(prod_json_1["default"], as, Config);
web.start();
