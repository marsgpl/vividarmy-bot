import { MongoClient } from 'mongodb';

import _log from 'modules/log';
import { Config } from 'class/Config';
import { MongoState } from 'state/MongoState';

export abstract class BaseBot {
    protected log: Function;
    protected config: Config;

    constructor(botName: string, config: Config) {
        this.log = _log.setName(botName);
        this.config = config;
    }

    protected async connectToMongo(): Promise<MongoState> {
        const { log, config } = this;

        log('connecting to storage ...');

        const client = await MongoClient.connect(config.mongo.connectUrl);

        const db = client.db(config.mongo.db);

        const collections = {
            cookies: await db.collection('cookies'),
            players: await db.collection('players'),
            bots: await db.collection('bots'),
        };

        log('connected to storage:', config.mongo.db);

        return {
            client,
            db,
            collections,
        };
    }
}
