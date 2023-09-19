import { z } from "zod";

export default {
	newCompany: z.object({
		body: z.object({
			name: z.string(),
		}),
	}),

	newBooth: z.object({
		body: z.object({
			companyId: z.string(),
			location: z.string(),
		}),
	}),

	leaderBoard: z.object({
		query: z.object({
			type: z.enum(["collection", "vehicle"]),
			limit: z.string(),
			offset: z.string(),
		}),
	}),
};
