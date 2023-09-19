import { Collection, CreateIndexesOptions, DeleteOptions, FindCursor, MongoClient, ObjectId } from "mongodb";
import { envConfig } from "./envConfig";

export const mongoClient = new MongoClient(envConfig.mongo.connectionUrl, {
	auth: {
		username: envConfig.mongo.username,
		password: envConfig.mongo.password,
	},
	maxIdleTimeMS: 120000, // 2 minutes
	minPoolSize: 5,
	maxPoolSize: envConfig.isProd ? 40 : 5,
	maxConnecting: 5,
	socketTimeoutMS: 30000, // 30 seconds
	compressors: ["zstd"], // this will help much more in the queries with bigger responses
});

export const mongodb = mongoClient.db(envConfig.mongo.dbName);

export const MongoId = ObjectId;
export type MongoIdType = ObjectId;
export type MongoCursor = FindCursor;

export type MongoCollection = Collection;
export type MongoCreateIndexesOptions = CreateIndexesOptions;
export type MongoDeleteOptions = DeleteOptions;

export async function tearDownMongo() {
	await mongoClient.close();
}
