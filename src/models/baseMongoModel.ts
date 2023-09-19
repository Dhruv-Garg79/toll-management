import { SafeParseError, SafeParseReturnType } from 'zod/lib/types';
import Logger from '../utils/logger';
import Result from '../utils/result';

export default abstract class BaseMongoModel<T> {
	protected readonly logger: Logger;

	constructor(namespace: string) {
		this.logger = new Logger(namespace);
	}

	protected handleValidateFailure(result: SafeParseReturnType<any, any>, input: T): Result<any> {
		const failResult = result as SafeParseError<T>;
		this.logger.error('validation error for input', input, failResult.error);
		return Result.error('validation failed');
	}

	// this flattens the object to a single level
	protected flattenObject(data: T, prefix = '') {
		const flattened = {};
		Object.keys(data).forEach(key => {
			const val = data[key];
			if (typeof val === 'object' && !(val instanceof Array || val instanceof Date)) {
				Object.assign(flattened, this.flattenObject(val, `${prefix}${key}.`));
			} else flattened[`${prefix}${key}`] = val;
		});

		return flattened;
	}
}
