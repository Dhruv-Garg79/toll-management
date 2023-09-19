import { z } from "zod";
import BaseMongoCollection from "../baseMongoCollection";

export type TTollBooth = z.infer<typeof TollBoothCollection.schema>;

export default class TollBoothCollection extends BaseMongoCollection<TTollBooth> {
	static readonly collection = "toll_booth";

	static readonly schema = z.object({
		_id: z.string(),
		companyId: z.string(),
		totalCollection: z.number(),
		totalVehiclePassed: z.number(),
		location: z.string(),
		createdOn: z.date(),
	});

	constructor() {
		super(TollBoothCollection.collection, TollBoothCollection.schema);
	}

	public createIndex() {
		this.createDBIndexes([{ totalCollection: 1 }, { totalVehiclePassed: 1 }]);
	}
}
