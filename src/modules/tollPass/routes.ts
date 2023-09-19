import { apiHandler } from "../../lib/apiHandler";
import { TApiHandler } from "../../lib/types";
import { validate } from "../../middlewares/validate";
import Controller from "./controller";
import validation from "./validation";

const controller = new Controller();

const passRoutes: Array<TApiHandler> = [
	apiHandler("GET", "/charge/list", controller.getPassChargeList),
	apiHandler("POST", "/validate", controller.validatePass, validate(validation.validatePass)),
	apiHandler("POST", "/buy", controller.buyPass, validate(validation.buyPass)),
	apiHandler("POST", "/payment/webhook", controller.paymentWebhook, validate(validation.paymentWebhook)),
];

export default passRoutes;
