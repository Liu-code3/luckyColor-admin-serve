SET time_zone = '+08:00';

CREATE TABLE IF NOT EXISTS `_system_maintenance_logs` (
  `maintenance_key` VARCHAR(191) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `executed_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`maintenance_key`)
) COMMENT = '系统数据库维护日志';

START TRANSACTION;

INSERT IGNORE INTO `_system_maintenance_logs` (
  `maintenance_key`,
  `description`
) VALUES (
  'timezone_backfill_plus_8_hours_20260322',
  '历史时间字段统一补齐东八区偏移，所有现有时间增加8小时'
);

SET @should_run := ROW_COUNT();

UPDATE `users`
SET
  `created_at` = IF(@should_run = 1, DATE_ADD(`created_at`, INTERVAL 8 HOUR), `created_at`),
  `updated_at` = IF(@should_run = 1, DATE_ADD(`updated_at`, INTERVAL 8 HOUR), `updated_at`);

UPDATE `menus`
SET
  `created_at` = IF(@should_run = 1, DATE_ADD(`created_at`, INTERVAL 8 HOUR), `created_at`),
  `updated_at` = IF(@should_run = 1, DATE_ADD(`updated_at`, INTERVAL 8 HOUR), `updated_at`);

UPDATE `dictionaries`
SET
  `created_at` = IF(@should_run = 1, DATE_ADD(`created_at`, INTERVAL 8 HOUR), `created_at`),
  `updated_at` = IF(@should_run = 1, DATE_ADD(`updated_at`, INTERVAL 8 HOUR), `updated_at`);

UPDATE `roles`
SET
  `created_at` = IF(@should_run = 1, DATE_ADD(`created_at`, INTERVAL 8 HOUR), `created_at`),
  `updated_at` = IF(@should_run = 1, DATE_ADD(`updated_at`, INTERVAL 8 HOUR), `updated_at`);

UPDATE `departments`
SET
  `created_at` = IF(@should_run = 1, DATE_ADD(`created_at`, INTERVAL 8 HOUR), `created_at`),
  `updated_at` = IF(@should_run = 1, DATE_ADD(`updated_at`, INTERVAL 8 HOUR), `updated_at`);

UPDATE `user_roles`
SET
  `assigned_at` = IF(@should_run = 1, DATE_ADD(`assigned_at`, INTERVAL 8 HOUR), `assigned_at`);

UPDATE `role_menus`
SET
  `assigned_at` = IF(@should_run = 1, DATE_ADD(`assigned_at`, INTERVAL 8 HOUR), `assigned_at`);

UPDATE `role_department_scopes`
SET
  `assigned_at` = IF(@should_run = 1, DATE_ADD(`assigned_at`, INTERVAL 8 HOUR), `assigned_at`);

UPDATE `system_configs`
SET
  `created_at` = IF(@should_run = 1, DATE_ADD(`created_at`, INTERVAL 8 HOUR), `created_at`),
  `updated_at` = IF(@should_run = 1, DATE_ADD(`updated_at`, INTERVAL 8 HOUR), `updated_at`);

UPDATE `notices`
SET
  `published_at` = IF(@should_run = 1, DATE_ADD(`published_at`, INTERVAL 8 HOUR), `published_at`),
  `created_at` = IF(@should_run = 1, DATE_ADD(`created_at`, INTERVAL 8 HOUR), `created_at`),
  `updated_at` = IF(@should_run = 1, DATE_ADD(`updated_at`, INTERVAL 8 HOUR), `updated_at`);

COMMIT;
