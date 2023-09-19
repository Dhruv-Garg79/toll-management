import { apiHandler } from "../../lib/apiHandler";
import { TApiHandler } from "../../lib/types";
import { validate } from "../../middlewares/validate";
import Controller from "./controller";
import validation from "./validation";

const controller = new Controller();

const companyRoutes: Array<TApiHandler> = [
	apiHandler("POST", "/", controller.newCompany, validate(validation.newCompany)),
	apiHandler("POST", "/toll/booth", controller.newBooth, validate(validation.newBooth)),
	apiHandler("GET", "/toll/booth/leaderboards", controller.leaderBoard, validate(validation.leaderBoard)),
];

export default companyRoutes;
