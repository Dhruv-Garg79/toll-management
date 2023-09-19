import { z } from "zod";
import BaseMongoCollection from "../baseMongoCollection";

export type TTollCompany = z.infer<typeof TollCompanyCollection.schema>;

export default class TollCompanyCollection extends BaseMongoCollection<TTollCompany> {
	static readonly collection = "toll_company";

	static readonly schema = z.object({
		_id: z.string(),
		name: z.string(),
		createdOn: z.date(),
	});

	constructor() {
		super(TollCompanyCollection.collection, TollCompanyCollection.schema);
	}
}
