import { Pool } from "mysql2/promise";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { GrowthRepository } from "./src/modules/vp-access-business/growth/repositories/growth.repository";
import { DateHelper } from "./src/core/helpers/date";

dotenv.config();

async function main() {
  const nisPool = mysql.createPool(process.env.NIS_DB_URL || "mysql://root:@localhost:3306/nis");
  const prospectPool = mysql.createPool(process.env.PROSPECT_DB_URL || "mysql://root:@localhost:3306/prospect");
  const dashboardPool = mysql.createPool(process.env.DASHBOARD_DB_URL || "mysql://root:@localhost:3306/dashboard");

  const repo = new GrowthRepository(nisPool, prospectPool, dashboardPool);
  const { startDate, endDate } = DateHelper.getDatesForPeriod('month');
  
  const mrc = await repo.getForecastMrc(startDate, endDate);
  const block = await repo.getForecastChurnBlocked('020', startDate, endDate);
  const contract = await repo.getForecastChurnContract('020', startDate, endDate);
  const ticket = await repo.getForecastChurnTicket('020', startDate, endDate);
  const usage = await repo.getForecastChurnUsage('020', startDate, endDate);

  console.log({ mrc, block, contract, ticket, usage });
  process.exit(0);
}
main();
