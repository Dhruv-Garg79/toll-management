import { SafeParseReturnType, ZodObject, ZodRecord } from 'zod';
import { MongoCollection, mongoClient } from '../config/mongodb';
import { Projection } from './baseMongoCollection';
import BaseMongoModel from './baseMongoModel';
import Result from '../utils/result';
import Errors from '../utils/errors';

export default class MongoDocument<T> extends BaseMongoModel<T> {
	private safeParse: (fields: T) => SafeParseReturnType<any, any>;
	private readonly collection: MongoCollection;
	private readonly filter: { _id: string };
	public readonly docId: string;

	constructor(collection: MongoCollection, documentId: string, schema: ZodObject<any> | ZodRecord<any>) {
		super(`${documentId} doc`);
		this.docId = documentId;
		this.filter = { _id: documentId };
		this.collection = collection;
		this.safeParse = schema instanceof ZodObject ? schema.deepPartial().safeParse : schema.safeParse;
	}

	public async get(projection?: Projection<T>): Promise<Result<T>> {
		try {
			const doc = (await this.collection.findOne(
				this.filter as any,
				projection ? { projection: projection } : {},
			)) as unknown as T;

			if (!doc) return Result.error(Errors.DOES_NOT_EXIST);

			const parseResult = this.safeParse(doc);
			if (!parseResult.success) {
				return this.handleValidateFailure(parseResult, doc) as any;
			}

			return new Result(parseResult.data as T);
		} catch (error) {
			this.logger.error('%j', error);
			return Result.error(error.message);
		}
	}

	public async update(data: T, upsert = true): Promise<Result<boolean>> {
		try {
			const validateRes = this.safeParse(data);

			if (!validateRes.success) {
				return this.handleValidateFailure(validateRes, data);
			}

			const update = await this.collection.updateOne(
				this.filter as any,
				{
					$set: this.flattenObject(validateRes.data as any),
					$setOnInsert: validateRes.data.createdOn ? {} : { createdOn: new Date() },
				},
				{ upsert: upsert },
			);
			const changeCount = update.matchedCount ?? 0 + update.modifiedCount ?? 0 + update.upsertedCount ?? 0;

			return new Result(changeCount > 0);
		} catch (error) {
			this.logger.error('%j', error);
			return Result.error(error.message);
		}
	}

	public async create(data: T): Promise<Result<boolean>> {
		try {
			const validateRes = this.safeParse(data);

			if (!validateRes.success) {
				return this.handleValidateFailure(validateRes, data);
			}

			(validateRes.data as any)._id = this.filter._id;
			(validateRes.data as any).createdOn = new Date();
			const insert = await this.collection.insertOne(validateRes.data);
			return new Result(insert.acknowledged);
		} catch (error) {
			this.logger.error('%j', error);
			return Result.error(error.message);
		}
	}

	public async increment(data: T): Promise<Result<boolean>> {
		try {
			const validateRes = this.safeParse(data);

			if (!validateRes.success) {
				return this.handleValidateFailure(validateRes, data);
			}

			const update = await this.collection.updateOne(
				this.filter as any,
				{ $inc: data, $setOnInsert: { createdOn: new Date() } },
				{ upsert: true },
			);
			const changeCount = update.matchedCount ?? 0 + update.modifiedCount ?? 0 + update.upsertedCount ?? 0;

			return new Result(changeCount > 0);
		} catch (error) {
			this.logger.error('%j', error);
			return Result.error(error.message);
		}
	}

	public async delete(): Promise<Result<boolean>> {
		try {
			const deleted = await this.collection.deleteOne(this.filter as any);
			return new Result(deleted.deletedCount > 0);
		} catch (error) {
			this.logger.error('%j', error);
			return Result.error(error.message);
		}
	}

	public async transaction(func: () => Promise<Result<any>>): Promise<Result<any>> {
		const session = mongoClient.startSession();

		try {
			let result: Result<any>;
			await session.withTransaction(async () => {
				result = await func();
			});
			return result;
		} catch (err) {
			this.logger.error('%j', err);
			return Result.error(err.message);
		} finally {
			await session.endSession();
		}
	}
}
