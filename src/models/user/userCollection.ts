import { z } from "zod";
import BaseMongoCollection from "../baseMongoCollection";

export type TUser = z.infer<typeof UserCollection.schema>;

export default class UserCollection extends BaseMongoCollection<TUser> {
	static readonly collection = "users";

	static readonly schema = z.object({
		_id: z.string(),
		name: z.string(),
		phoneNumber: z.string(),
		createdOn: z.date(),
	});

	constructor() {
		super(UserCollection.collection, UserCollection.schema);
	}
}
