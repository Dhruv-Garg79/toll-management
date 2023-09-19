import ApiRequest from "../../lib/apiRequest";
import ApiResponse from "../../lib/apiResponse";
import TollBoothCollection, { TTollBooth } from "../../models/toll/tollBoothCollection";
import TollCompanyCollection, { TTollCompany } from "../../models/toll/tollCompanyCollection";

export default class Controller {
	private readonly companyCollection = new TollCompanyCollection();
	private readonly boothCollection = new TollBoothCollection();

	public newCompany = async (req: ApiRequest): Promise<ApiResponse> => {
		const { name } = req.body;
		const pass: TTollCompany = {
			name,
		};

		const res = await this.companyCollection.insert(pass);
		return res.apiResponse();
	};

	public newBooth = async (req: ApiRequest): Promise<ApiResponse> => {
		const { companyId, location } = req.body;
		const pass: TTollBooth = {
			companyId,
			location,
			totalCollection: 0,
			totalVehiclePassed: 0,
		};

		const res = await this.boothCollection.insert(pass);
		return res.apiResponse();
	};

	public leaderBoard = async (req: ApiRequest): Promise<ApiResponse> => {
		const { type, limit, offset } = req.query;
		const res = await this.boothCollection.filterAndSort({
			sort:
				type === "collection"
					? {
							totalCollection: -1,
					  }
					: {
							totalVehiclePassed: -1,
					  },
			limit: parseInt(limit),
			offset: parseInt(offset),
		});
		return res.apiResponse();
	};
}
