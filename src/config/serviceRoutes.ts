import { TApiHandler } from '../lib/types';
import sampleRoutes from '../modules/sample/routes';

const serviceRoutes: { [key: string]: Array<TApiHandler> } = {
	sample: sampleRoutes,
};

export default serviceRoutes;
