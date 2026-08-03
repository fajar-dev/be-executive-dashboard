-- Unify sales staff into a single `sales` table for both access_home and access_business.
-- Previously only access_home staff were stored (table `sales_home`).
--
-- Adds a `type` column to distinguish the crawl source:
--   'access_home'     -> crawled via Account Manager -> VP Internet Access Home
--   'access_business' -> crawled via Business Development Executive -> VP Internet Access Business
--
-- RENAME TABLE keeps the self-referencing manager_id foreign key intact
-- (InnoDB rewrites it to point at the renamed table automatically).
-- Existing rows default to 'access_home'.

RENAME TABLE `sales_home` TO `sales`;

ALTER TABLE `sales`
    ADD COLUMN `type` varchar(50) NOT NULL DEFAULT 'access_home' AFTER `status`;
