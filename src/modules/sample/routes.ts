import { apiHandler } from '../../lib/apiHandler';
import { TApiHandler } from '../../lib/types';
import { validate } from '../../middlewares/validate';
import Controller from './controller';
import validation from './validation';

const controller = new Controller();

const sampleRoutes: Array<TApiHandler> = [
	apiHandler('GET', '/hello', controller.getHello, validate(validation.getHello)),
];

export default sampleRoutes;
