import { TApiHandler } from "../lib/types";
import companyRoutes from "../modules/tollBooths/routes";
import passRoutes from "../modules/tollPass/routes";
import userRoutes from "../modules/users/routes";

const serviceRoutes: { [key: string]: Array<TApiHandler> } = {
	pass: passRoutes,
	company: companyRoutes,
	users: userRoutes
};

export default serviceRoutes;
