import { Context } from "hono";
import { DateHelper } from "../../core/helpers/date";
import { ApiResponse } from "../../core/helpers/response";

export class AdditionalController {
    async getPeriod(c: Context) {
        const period = c.req.query('period');
        const breakdown = DateHelper.getPeriodBreakdown(period);
        return ApiResponse.success(c, breakdown, "Period retrieved successfully");
    }
}
