import {
    MongoClient,
    Db as MongoDb,
    Collection as MongoCollection,
} from 'mongodb';

export interface MongoState {
    client: MongoClient;
    db: MongoDb;
    collections: {
        [key: string]: MongoCollection;
    };
}
