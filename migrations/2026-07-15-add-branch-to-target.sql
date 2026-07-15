-- Make target revenue per-branch (in addition to per-year).
-- `branch` stores the dashboard branch selector: 'all', 'null' (Medan/HO),
-- '025' (Jakarta), '062' (Bali), '027' (Binjai), '029' (Tanjung Morawa).
-- Existing single-per-year rows are treated as the overall ('all') target.

ALTER TABLE `vp_access_business_target`
    ADD COLUMN `branch` varchar(10) NOT NULL DEFAULT 'all' AFTER `year`,
    DROP PRIMARY KEY,
    ADD PRIMARY KEY (`year`, `branch`);

ALTER TABLE `vp_access_business_target_log`
    ADD COLUMN `branch` varchar(10) NOT NULL DEFAULT 'all' AFTER `year`;
