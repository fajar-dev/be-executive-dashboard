import { Pool } from "mysql2/promise";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const pool = mysql.createPool(process.env.NIS_DB_URL || "mysql://root:@localhost:3306/nis");
  const [rows] = await pool.query("SELECT * FROM traff_data LIMIT 1");
  console.log(rows);
  process.exit(0);
}
main();
