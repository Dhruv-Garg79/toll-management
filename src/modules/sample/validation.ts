import { z } from "zod";

export default {
	getHello: z.object({
		query: z.object({
			name: z.string(),
		}),
	}),
};
