import { z } from "zod";
import { PassPaymentStatus, PassType } from "../../models/toll/tollPassCollection";

export default {
	validatePass: z.object({
		body: z.object({
			passId: z.string(),
			boothId: z.string(),
			isReturn: z.boolean(),
		}),
	}),

	buyPass: z.object({
		body: z.object({
			type: z.nativeEnum(PassType),
			boothId: z.string(),
		}),
	}),

	paymentWebhook: z.object({
		body: z.object({
			passId: z.string(),
			paymentStatus: z.nativeEnum(PassPaymentStatus),
		}),
	}),
};
