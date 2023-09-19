import { z } from "zod";

export default {
	newUser: z.object({
		body: z.object({
			name: z.string(),
			phoneNumber: z.string(),
		}),
	}),

	newBooth: z.object({
		body: z.object({
			companyId: z.string(),
			location: z.string(),
		}),
	}),
};
