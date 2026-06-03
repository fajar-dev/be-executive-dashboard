CREATE TABLE `users` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `employee_id` varchar(255) NOT NULL UNIQUE,
    `name` varchar(255) NOT NULL,
    `email` varchar(255) NOT NULL UNIQUE,
    `photo` varchar(255) NULL,
    `is_active` tinyint(1) NOT NULL DEFAULT 1,
    `created_at` timestamp NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `vp_access_business_target` (
    `year` int(11) NOT NULL,
    `yearly_target` bigint NOT NULL DEFAULT 0,
    `jan` bigint NOT NULL DEFAULT 0,
    `feb` bigint NOT NULL DEFAULT 0,
    `mar` bigint NOT NULL DEFAULT 0,
    `apr` bigint NOT NULL DEFAULT 0,
    `may` bigint NOT NULL DEFAULT 0,
    `jun` bigint NOT NULL DEFAULT 0,
    `jul` bigint NOT NULL DEFAULT 0,
    `aug` bigint NOT NULL DEFAULT 0,
    `sep` bigint NOT NULL DEFAULT 0,
    `oct` bigint NOT NULL DEFAULT 0,
    `nov` bigint NOT NULL DEFAULT 0,
    `dec` bigint NOT NULL DEFAULT 0,
    `is_locked` tinyint(1) NOT NULL DEFAULT 0,
    `updated_by` int(11) NOT NULL,
    `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`year`),
    FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `vp_access_business_target_log` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `year` int(11) NOT NULL,
    `old_value` json NOT NULL,
    `new_value` json DEFAULT NULL,
    `created_by` int(11) NOT NULL,
    `updated_by` int(11) DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NULL DEFAULT NULL,
    `reason` TEXT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`),
    FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;