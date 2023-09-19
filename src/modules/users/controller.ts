import ApiRequest from "../../lib/apiRequest";
import ApiResponse from "../../lib/apiResponse";
import TollPassCollection from "../../models/toll/tollPassCollection";
import UserCollection, { TUser } from "../../models/user/userCollection";

export default class Controller {
	private readonly userCollection = new UserCollection();
	private readonly passCollection = new TollPassCollection();

	public newUser = async (req: ApiRequest): Promise<ApiResponse> => {
		const { name, phoneNumber } = req.body;
		const user: TUser = {
			name,
			phoneNumber: phoneNumber,
		};

		const res = await this.userCollection.insert(user);
		return res.apiResponse();
	};

	public getPasses = async (req: ApiRequest): Promise<ApiResponse> => {
		const res = await this.passCollection.getByFields({ uid: req.uid });
		return res.apiResponse();
	};
}
