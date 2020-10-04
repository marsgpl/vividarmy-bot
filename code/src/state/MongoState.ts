import {
    MongoClient,
    Db as MongoDb,
    Collection as MongoCollection,
} from 'mongodb';

export interface MongoState {
    client: MongoClient;
    db: MongoDb;
    collections: {
        cookies: MongoCollection;
        players: MongoCollection;
        puppetconfigs: MongoCollection;
    };
}
