import { nusaprospectPool } from './src/config/nusaprospect.db'

async function run() {
    try {
        const [activityRows] = await nusaprospectPool.query<any[]>(
            `SELECT
                COUNT(DISTINCT clc.id) + COUNT(DISTINCT pt.id) + COUNT(DISTINCT pci.id) total
            FROM (
                SELECT
                    DISTINCT gu.user_uuid user_id
                FROM group_users gu
                LEFT JOIN groups g ON
                    g.id = gu.group_id
                WHERE gu.group_id IN (57, 21, 43)
                OR g.group_parent_id IN (57, 21, 43)
            ) u
            LEFT JOIN customer_log_calls clc ON
                IFNULL(clc.assigned_to_id, clc.created_by) = u.user_id
                AND YEAR(clc.created_at) = YEAR(CURDATE())
                AND MONTH(clc.created_at) = MONTH(CURDATE())
            LEFT JOIN prospect_tasks pt ON
                IFNULL(pt.assigned_to_id, pt.created_by) = u.user_id
                AND YEAR(pt.created_at) = YEAR(CURDATE())
                AND MONTH(pt.created_at) = MONTH(CURDATE())
            LEFT JOIN prospect_check_ins pci ON
                pci.user_uuid = u.user_id
                AND YEAR(pci.created_at) = YEAR(CURDATE())
                AND MONTH(pci.created_at) = MONTH(CURDATE())`
        )
        console.log('activityRows from exact user query', activityRows)

        const startDate = '2026-06-01'
        const endDate = '2026-06-30'
        const [activityRows2] = await nusaprospectPool.query<any[]>(
            `SELECT
                COUNT(DISTINCT clc.id) + COUNT(DISTINCT pt.id) + COUNT(DISTINCT pci.id) total
            FROM (
                SELECT
                    DISTINCT gu.user_uuid user_id
                FROM group_users gu
                LEFT JOIN groups g ON
                    g.id = gu.group_id
                WHERE gu.group_id IN (57, 21, 43)
                OR g.group_parent_id IN (57, 21, 43)
            ) u
            LEFT JOIN customer_log_calls clc ON
                IFNULL(clc.assigned_to_id, clc.created_by) = u.user_id
                AND DATE(clc.created_at) >= ?
                AND DATE(clc.created_at) <= ?
            LEFT JOIN prospect_tasks pt ON
                IFNULL(pt.assigned_to_id, pt.created_by) = u.user_id
                AND DATE(pt.created_at) >= ?
                AND DATE(pt.created_at) <= ?
            LEFT JOIN prospect_check_ins pci ON
                pci.user_uuid = u.user_id
                AND DATE(pci.created_at) >= ?
                AND DATE(pci.created_at) <= ?`,
            [startDate, endDate, startDate, endDate, startDate, endDate]
        )
        console.log('activityRows from my parameterized query', activityRows2)

    } catch (e) {
        console.error(e)
    } finally {
        process.exit()
    }
}
run()
