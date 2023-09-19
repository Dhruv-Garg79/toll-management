import server from "./config/app";
import { envConfig } from "./config/envConfig";
import { mongoClient } from "./config/mongodb";

const exitHandler = (error) => {
	console.error(error);
	if (server) {
		server.close(() => {
			console.info("Server closed");
			process.exit(1);
		});
	} else {
		process.exit(1);
	}
};

process.on("uncaughtException", exitHandler);
process.on("unhandledRejection", exitHandler);

process.on("SIGTERM", () => {
	exitHandler("SIGTERM received");
});

const start = async () => {
	try {
		await mongoClient.connect();
		await server.listen({ port: envConfig.serverPort });
		console.info(`Listening to port ${envConfig.serverPort}\n`);
	} catch (err) {
		console.error(err);
		exitHandler("starting server failed");
	}
};

start();
