import { SafeParseError, SafeParseReturnType, Schema } from "zod";
import ApiRequest from "../lib/apiRequest";
import ApiResponse from "../lib/apiResponse";
import Logger from "../utils/logger";

const logger = new Logger("validation middleware");

export const validate =
	(schema: Schema<object>) =>
	async (req: ApiRequest): Promise<ApiResponse> => {
		const validateRes: SafeParseReturnType<object, any> = await schema.safeParseAsync(req.get());

		if (!validateRes.success) {
			const failResult = validateRes as SafeParseError<any>;
			logger.error("validation failed", req.url, JSON.parse(failResult.error.message));

			return ApiResponse.badRequest({
				message: "validation failed",
				body: failResult.error.errors,
			});
		}

		return ApiResponse.success({ message: "validation successful", body: {} });
	};
