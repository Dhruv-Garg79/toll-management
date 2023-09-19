import * as dotenv from 'dotenv';
import path from 'path';

const env = process.env.NODE_ENV;
const isProd = env === 'prod';

console.log(`Loading config for ${env} environment`);
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) });

export const envConfig = {
	env: env,
	isProd: isProd,
	serverPort: Number(process.env.SERVER_PORT),
	mongo: {
		username: process.env.MONGO_USERNAME,
		password: process.env.MONGO_PASSWORD,
		connectionUrl: process.env.MONGO_CONNECTION_URL,
		dbName: process.env.MONGO_DB_NAME,
	},
};
