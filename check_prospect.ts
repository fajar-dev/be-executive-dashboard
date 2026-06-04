import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const pool = mysql.createPool(process.env.PROSPECT_DB_URL || "mysql://root:@localhost:3306/prospect");
  const [rows] = await pool.query("DESCRIBE prospect_opportunities");
  console.log(rows);
  process.exit(0);
}
main();
