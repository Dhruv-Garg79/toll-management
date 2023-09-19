import ApiRequest from "../../lib/apiRequest";
import ApiResponse from "../../lib/apiResponse";
import TollBoothCollection from "../../models/toll/tollBoothCollection";
import TollPassCollection, { PassPaymentStatus, PassType, TTollPass } from "../../models/toll/tollPassCollection";
import DateHelper from "../../utils/dateHelper";

export default class Controller {
	private readonly passCollection = new TollPassCollection();
	private readonly boothCollection = new TollBoothCollection();

	private readonly chargeList = {
		single: 100,
		return: 200,
		"7day": 500,
	};

	public getPassChargeList = async (req: ApiRequest): Promise<ApiResponse> => {
		return ApiResponse.success({ body: this.chargeList });
	};

	public validatePass = async (req: ApiRequest): Promise<ApiResponse> => {
		const { passId, boothId, isReturn } = req.body;

		const passRes = await this.passCollection.getByPk(passId);
		const pass = passRes.value;

		if (passRes.error) return ApiResponse.internalServerError({});
		if (!pass) return ApiResponse.badRequest({ message: "Invalid passId", body: this.chargeList });

		if (pass.uid !== req.uid)
			return ApiResponse.badRequest({ message: "This pass does not belong to you", body: this.chargeList });
		
		if (pass.paymentStatus !== PassPaymentStatus.success)
			return ApiResponse.badRequest({ message: "please check payment status of this pass", body: this.chargeList });

		if (pass.boothId !== boothId)
			return ApiResponse.badRequest({ message: "this pass is not valid for this toll booth", body: this.chargeList });

		const now = new Date();
		const passUpdate: TTollPass = {
			usage: (pass.usage ?? 0) + 1,
		};

		if (pass.expireAt < now) return ApiResponse.badRequest({ message: "this pass has expired", body: this.chargeList });

		if (pass.type === PassType.single && pass.usage >= 1)
			return ApiResponse.badRequest({ message: "this pass has already been used", body: this.chargeList });

		if (pass.type === PassType.return) {
			if (pass.usage >= 2)
				return ApiResponse.badRequest({
					message: "can only be used for 1 complete return trip",
					body: this.chargeList,
				});
			if (pass.usage === 1 && !isReturn)
				return ApiResponse.badRequest({ message: "can only be used return trip", body: this.chargeList });

			DateHelper.addHours(now, 24);
			passUpdate.expireAt = now;
		}

		await Promise.all([
			this.passCollection.updateByPk(passId, passUpdate),
			this.boothCollection.incrementOne(pass.boothId, {
				totalVehiclePassed: 1,
			}),
		]);

		return ApiResponse.success({ message: "you may pass" });
	};

	public buyPass = async (req: ApiRequest): Promise<ApiResponse> => {
		const { type, boothId } = req.body;

		const booth = await this.boothCollection.getByPk(boothId);
		if(booth.error) return ApiResponse.internalServerError({message: booth.error})

		const pass: TTollPass = {
			uid: req.uid,
			type: type,
			usage: 0,
			boothId: boothId,
			paymentStatus: PassPaymentStatus.pending,
		};

		if (type === PassType["7day"]) {
			pass.expireAt = DateHelper.addDays(new Date(), 7);
		}

		const res = await this.passCollection.insert(pass);
		return res.apiResponse();
	};

	public paymentWebhook = async (req: ApiRequest): Promise<ApiResponse> => {
		const { passId, paymentStatus } = req.body;

		const pass = await this.passCollection.getByPk(passId);
		if (pass.error) return ApiResponse.internalServerError({ message: pass.error });
		if (!pass.value) return ApiResponse.badRequest({ message: "Invalid passId" });

		if (pass.value.paymentStatus !== PassPaymentStatus.pending)
			return ApiResponse.badRequest({ message: "payment already processed" });

		const res = await this.passCollection.updateByPk(passId, { paymentStatus });

		if (paymentStatus === PassPaymentStatus.success) {
			await this.boothCollection.incrementOne(pass.value.boothId, {
				totalCollection: this.chargeList[pass.value.type],
			});
		}

		return res.apiResponse();
	};
}
