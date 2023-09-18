import { HttpMethod } from "../utils/httpStatus";

export default class ApiRequest {
	body: any = {};
	query: any = {};
	readonly method: HttpMethod;
	readonly requestId: string;
	readonly ip: string;
	readonly param: any = {};
	readonly headers: any = {};
	readonly url: string;

	constructor(
		method: HttpMethod,
		body: any,
		param: any,
		query: any,
		args: { headers: any; requestId: string; url: string },
	) {
		this.method = method;
		this.body = body;
		this.param = param;
		this.query = query;
		this.headers = args.headers;
		this.requestId = args.requestId;
		this.url = args.url;
		this.ip = this.headers["x-forwarded-for"]?.split(",")[0] ?? "";
	}

	public get(): { body: any; param: any; query: any; headers: any } {
		return {
			body: this.body,
			param: this.param,
			query: this.query,
			headers: this.headers,
		};
	}
}
