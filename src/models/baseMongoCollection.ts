import { ZodObject } from 'zod';
import {
	MongoCollection,
	MongoCreateIndexesOptions,
	MongoCursor,
	mongodb,
	MongoDeleteOptions,
	MongoId,
	MongoIdType,
} from '../config/mongodb';
import MongoDocument from './mongoDocument';
import Errors from '../utils/errors';
import Result from '../utils/result';
import BaseMongoModel from './baseMongoModel';
import { NestedObjectPaths } from '../types/nestedObjectPaths';

type Operators = '$ne' | '$lt' | '$gt' | '$lte' | '$gte' | '$in' | '$eq' | '$or';
type ValueTypes = string | number | Date | string[] | boolean;
type Filter<T> = {
	[field in NestedObjectPaths<T>]?:
		| {
				[operator in Operators]?: ValueTypes;
		  }
		| ValueTypes;
};

export type MongoDocFields = { createdOn?: Date; _id?: MongoIdType | string };
export type Projection<T> = {
	[field in NestedObjectPaths<T>]?: 0 | 1;
};

export default abstract class BaseMongoCollection<T> extends BaseMongoModel<T> {
	private readonly typeSchema: ZodObject<any>;
	protected readonly collection: MongoCollection;

	private parseResult = (data: unknown): Result<T> => {
		if (!data) {
			return Result.error(Errors.DOES_NOT_EXIST);
		}
		(data as any)._id = (data as any)._id.toString();
		const parseRes = this.typeSchema.safeParse(data);
		if (parseRes.success) {
			return new Result(parseRes.data as T);
		}
		return this.handleValidateFailure(parseRes, data as T);
	};

	constructor(collectionName: string, schema: ZodObject<any>) {
		super(`${collectionName} collection`);
		this.typeSchema = schema;
		this.collection = mongodb.collection(collectionName);
	}

	public doc(documentId: string): MongoDocument<T> {
		return new MongoDocument<T>(this.collection, documentId, this.typeSchema);
	}

	public async insertDoc(_id: string | MongoIdType, data: T): Promise<Result<T>> {
		(data as any)._id = _id;
		return await this.insert(data);
	}

	public async insert(data: T): Promise<Result<T & MongoDocFields>> {
		try {
			(data as any).createdOn = new Date();
			const validateRes = this.typeSchema.deepPartial().safeParse(data);

			if (!validateRes.success) {
				return this.handleValidateFailure(validateRes, data) as any;
			}

			const res = await this.collection.insertOne(validateRes.data);
			this.logger.debug('insertion result %j', res);
			(data as any)._id = res.insertedId.toString();
			return new Result(data);
		} catch (error) {
			this.logger.error('%j', error);
			return Result.error(error.message);
		}
	}

	public async insertMany(array: Array<T>): Promise<Result<number>> {
		try {
			for (const data of array) {
				(data as any).createdOn = new Date();
				const validateRes = this.typeSchema.deepPartial().safeParse(data);

				if (!validateRes.success) {
					return this.handleValidateFailure(validateRes, data) as any;
				}
			}

			this.logger.debug('%j', array);
			const res = await this.collection.insertMany(array);
			this.logger.debug('insertion result %j', res);
			return new Result(res.insertedCount);
		} catch (error) {
			this.logger.error('%j', error);
			return Result.error(error.message);
		}
	}

	public async getByPk(_id: string): Promise<Result<T>> {
		try {
			const res = await this.collection.findOne({ _id: new MongoId(_id) });
			return this.parseResult(res);
		} catch (error) {
			this.logger.error('%j', error);
			return Result.error(error.message);
		}
	}

	public async getByCustomPk(_id: string): Promise<Result<T>> {
		try {
			const res = await this.collection.findOne({ _id: _id as any });
			return this.parseResult(res);
		} catch (error) {
			this.logger.error('%j', error);
			return Result.error(error.message);
		}
	}

	public async exists(_id: string): Promise<Result<boolean>> {
		try {
			const res = await this.collection.countDocuments({ _id: _id });
			return new Result(res > 0);
		} catch (error) {
			this.logger.error('%j', error);
			return Result.error(error.message);
		}
	}

	public async getAll(param: { limit?: number; offset?: number }): Promise<Result<Array<T>>> {
		try {
			const query = this.collection.find();
			return this.queryLimitAndOffset(query, param.limit, param.offset);
		} catch (error) {
			this.logger.error('%j', error);
			return Result.error(error.message);
		}
	}

	public async getByFields(
		filter: Filter<T & MongoDocFields>,
		param?: { limit?: number; offset?: number; project?: Projection<T> },
	): Promise<Result<Array<T & MongoDocFields>>> {
		return this.queryLimitAndOffset(this.collection.find(filter), param?.limit, param?.offset, param?.project);
	}

	public async getByAsMap(
		filter: Filter<T & MongoDocFields>,
		param?: { limit?: number; offset?: number; project?: Projection<T> },
	): Promise<Result<Map<string, T & MongoDocFields>>> {
		const arrRes = await this.queryLimitAndOffset(
			this.collection.find(filter),
			param?.limit,
			param?.offset,
			param?.project,
		);

		if (arrRes.error) return arrRes as any;

		const map = new Map<string, T & MongoDocFields>();
		arrRes.value.forEach(item => {
			map.set(item._id.toString(), item);
		});

		return new Result(map);
	}

	public async filterAndSort(param: {
		filter?: Filter<T>;
		or?: Filter<T>;
		sort: {
			[field in NestedObjectPaths<T>]?: 1 | -1;
		};
		limit?: number;
		offset?: number;
	}): Promise<Result<Array<T>>> {
		const filter = param.filter ?? {};
		if (param.or) {
			const statements = [];
			Object.keys(param.or).forEach(key => {
				statements.push({
					[key]: param.or[key],
				});
			});

			filter['$or'] = statements;
		}

		this.logger.verbose(filter);

		const query = this.collection.find(filter).sort(param.sort);
		return this.queryLimitAndOffset(query, param.limit, param.offset);
	}

	private async queryLimitAndOffset(
		query: MongoCursor,
		limit?: number,
		offset?: number,
		project?: Projection<T>,
	): Promise<Result<Array<T & MongoDocFields>>> {
		try {
			if (offset) query.skip(offset);
			if (limit) query.limit(limit);
			if (project) query.project(project);

			const docs = await query.toArray();
			const res = docs.map(d => {
				const parseRes = this.typeSchema.safeParse(d);
				if (parseRes.success) {
					return parseRes.data;
				}
				return d;
			});
			return new Result(res as unknown as Array<T & MongoDocFields>);
		} catch (error) {
			this.logger.error('%j', error);
			return Result.error(error.message);
		}
	}

	public async getCountByField(param: Filter<T>): Promise<Result<number>> {
		const res = await this.collection.countDocuments(param);
		return new Result(res);
	}

	public async delete(_id: string | MongoIdType): Promise<Result<boolean>> {
		try {
			const deleteRes = await this.collection.deleteOne({
				_id: _id as any,
			});
			return new Result(deleteRes.deletedCount > 0);
		} catch (error) {
			this.logger.error('Failed To Delete Document : %j', error);
			return Result.error(error.message);
		}
	}

	public async deleteMany(filter: Filter<T & MongoDocFields>, options?: MongoDeleteOptions): Promise<Result<boolean>> {
		try {
			const deletes = await this.collection.deleteMany(filter, options);
			const deleteCount = deletes.deletedCount ?? 0;
			return new Result(deleteCount > 0);
		} catch (error) {
			this.logger.error('%j', error);
			return Result.error(error.message);
		}
	}

	public async updateByPk(_id: string, data: T, upsert = true): Promise<Result<boolean>> {
		return this.updateOne(
			{
				_id: new MongoId(_id),
			} as any,
			data,
			upsert,
		);
	}

	public async incrementOne(_id: string, data: T, upsert = true): Promise<Result<boolean>> {
		try {
			const validateRes = this.typeSchema.deepPartial().safeParse(data);

			if (!validateRes.success) {
				return this.handleValidateFailure(validateRes, data);
			}

			const incrementObject = this.flattenObject(data);
			delete (incrementObject as any)._id;
			this.logger.debug(_id, { incrementObject });

			const update = await this.collection.updateOne(
				{
					_id: new MongoId(_id),
				},
				{ $inc: incrementObject },
				{ upsert: upsert },
			);

			const changeCount = update.matchedCount ?? 0 + update.modifiedCount ?? 0 + update.upsertedCount ?? 0;
			return new Result(changeCount > 0);
		} catch (error) {
			this.logger.error('%j', error);
			return Result.error(error.message);
		}
	}

	public async updateOne(filter: Filter<T>, data: T, upsert = true): Promise<Result<boolean>> {
		try {
			const validateRes = this.typeSchema.deepPartial().safeParse(data);

			if (!validateRes.success) {
				return this.handleValidateFailure(validateRes, data);
			}
			const update = await this.collection.updateOne(
				filter,
				{ $set: this.flattenObject(validateRes.data as any) },
				{ upsert: upsert },
			);

			const changeCount = update.matchedCount ?? 0 + update.modifiedCount ?? 0 + update.upsertedCount ?? 0;
			return new Result(changeCount > 0);
		} catch (error) {
			this.logger.error('%j', error);
			return Result.error(error.message);
		}
	}

	// https://stackoverflow.com/questions/41381722/mongodb-update-and-set-overwrites-the-document
	public async updateMany(filter: Filter<T>, data: T, upsert = true): Promise<Result<boolean>> {
		try {
			const validateRes = this.typeSchema.deepPartial().safeParse(data);

			if (!validateRes.success) {
				return this.handleValidateFailure(validateRes, data);
			}

			const obj = this.flattenObject(validateRes.data as any);
			this.logger.debug('%j', { obj });
			const update = await this.collection.updateMany(filter, { $set: obj }, { upsert: upsert });

			const changeCount = update.matchedCount ?? 0 + update.modifiedCount ?? 0 + update.upsertedCount ?? 0;
			this.logger.debug('%j', { changeCount });
			return new Result(changeCount > 0);
		} catch (error) {
			this.logger.error('%j', error);
			return Result.error(error.message);
		}
	}

	public async createDBIndexes(
		indexes: Array<
			{
				[field in NestedObjectPaths<T>]?: 1 | -1;
			} & { options?: MongoCreateIndexesOptions }
		>,
	): Promise<Array<string>> {
		const result = [];
		for (const index of indexes) {
			const options = index.options;
			if (options) delete index.options;

			// eslint-disable-next-line no-await-in-loop
			const res = await (options ? this.collection.createIndex(index, options) : this.collection.createIndex(index));

			this.logger.debug(res);
			result.push(res);
		}

		return result;
	}
}
