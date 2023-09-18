import ApiRequest from "../../lib/apiRequest";
import ApiResponse from "../../lib/apiResponse";
import Logger from "../../utils/logger";

export default class Controller {
	private readonly logger = new Logger("Sample Controller");

	public getHello = async (req: ApiRequest): Promise<ApiResponse> => {
		this.logger.debug("getHello", req.query.name);
		return ApiResponse.success({
			message: "hello",
		});
	};
}
