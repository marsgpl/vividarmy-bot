var log_1 = require('modules/log');
abstract;
var BaseBot = (function () {
    function BaseBot(botName, config) {
        this.async = connectToMongo();
        this.log = log_1["default"].setName(botName);
        this.config = config;
    }
    BaseBot.prototype.Promise = function () {
        var _a = this, log = _a.log, config = _a.config;
        var client = await, MongoClient, connect = (config.mongo.connectUrl);
        var db = client.db(config.mongo.db);
        var collections = {
            cookies: db.collection('cookies'),
            players: db.collection('players'),
            puppets: db.collection('puppets')
        };
        log("connected to storage: " + config.mongo.db);
        return {
            client: client,
            db: db,
            collections: collections
        };
    };
    return BaseBot;
})();
