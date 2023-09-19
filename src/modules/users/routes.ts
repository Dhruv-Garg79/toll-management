import { apiHandler } from "../../lib/apiHandler";
import { TApiHandler } from "../../lib/types";
import { validate } from "../../middlewares/validate";
import Controller from "./controller";
import validation from "./validation";

const controller = new Controller();

const userRoutes: Array<TApiHandler> = [
	apiHandler("POST", "/new", controller.newUser, validate(validation.newUser)),
	apiHandler("GET", "/passes", controller.getPasses),
];

export default userRoutes;
