import { z } from "zod";
import BaseMongoCollection from "../baseMongoCollection";

export type TTollPass = z.infer<typeof TollPassCollection.schema>;

export enum PassType {
	single = "single",
	return = "return",
	"7day" = "7day",
}

export enum PassPaymentStatus {
	pending = "pending",
	failed = "failed",
	success = "success",
}

export default class TollPassCollection extends BaseMongoCollection<TTollPass> {
	static readonly collection = "toll_pass";

	static readonly schema = z.object({
		_id: z.string(),
		boothId: z.string(),
		uid: z.string(),
		type: z.nativeEnum(PassType),
		expireAt: z.date().optional(),
		usage: z.number(),
		paymentStatus: z.nativeEnum(PassPaymentStatus),
		createdOn: z.date(),
	});

	constructor() {
		super(TollPassCollection.collection, TollPassCollection.schema);
	}

	public createIndex() {
		this.createDBIndexes([{ uid: 1 }]);
	}
}
