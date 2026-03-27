ALTER TABLE `tenant_packages`
  COMMENT = 'tenant packages',
  MODIFY COLUMN `id` VARCHAR(191) NOT NULL COMMENT 'package id',
  MODIFY COLUMN `name` VARCHAR(191) NOT NULL COMMENT 'package name',
  MODIFY COLUMN `code` VARCHAR(191) NOT NULL COMMENT 'package code',
  MODIFY COLUMN `status` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'package status',
  MODIFY COLUMN `max_users` INTEGER NULL COMMENT 'max users',
  MODIFY COLUMN `max_roles` INTEGER NULL COMMENT 'max roles',
  MODIFY COLUMN `max_menus` INTEGER NULL COMMENT 'max menus',
  MODIFY COLUMN `feature_flags` JSON NULL COMMENT 'feature flags',
  MODIFY COLUMN `remark` VARCHAR(191) NULL COMMENT 'remark',
  MODIFY COLUMN `created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'created at',
  MODIFY COLUMN `updated_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT 'updated at';

ALTER TABLE `tenants`
  COMMENT = 'tenants',
  MODIFY COLUMN `id` VARCHAR(191) NOT NULL COMMENT 'tenant id',
  MODIFY COLUMN `code` VARCHAR(191) NOT NULL COMMENT 'tenant code',
  MODIFY COLUMN `name` VARCHAR(191) NOT NULL COMMENT 'tenant name',
  MODIFY COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE' COMMENT 'tenant status',
  MODIFY COLUMN `expires_at` DATETIME(3) NULL COMMENT 'expires at',
  MODIFY COLUMN `contact_name` VARCHAR(191) NULL COMMENT 'contact name',
  MODIFY COLUMN `contact_phone` VARCHAR(191) NULL COMMENT 'contact phone',
  MODIFY COLUMN `contact_email` VARCHAR(191) NULL COMMENT 'contact email',
  MODIFY COLUMN `package_id` VARCHAR(191) NULL COMMENT 'package id',
  MODIFY COLUMN `remark` VARCHAR(191) NULL COMMENT 'remark',
  MODIFY COLUMN `created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'created at',
  MODIFY COLUMN `updated_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT 'updated at';

ALTER TABLE `tenant_audit_logs`
  COMMENT = 'tenant audit logs',
  MODIFY COLUMN `id` VARCHAR(191) NOT NULL COMMENT 'audit log id',
  MODIFY COLUMN `tenant_id` VARCHAR(191) NOT NULL COMMENT 'tenant id',
  MODIFY COLUMN `action` VARCHAR(191) NOT NULL COMMENT 'audit action',
  MODIFY COLUMN `operator_tenant_id` VARCHAR(191) NULL COMMENT 'operator tenant id',
  MODIFY COLUMN `operator_user_id` VARCHAR(191) NULL COMMENT 'operator user id',
  MODIFY COLUMN `detail` JSON NULL COMMENT 'audit detail',
  MODIFY COLUMN `created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'created at';

ALTER TABLE `dashboard_visits`
  COMMENT = 'dashboard visits',
  MODIFY COLUMN `id` VARCHAR(191) NOT NULL COMMENT 'visit id',
  MODIFY COLUMN `tenant_id` VARCHAR(191) NOT NULL COMMENT 'tenant id',
  MODIFY COLUMN `user_id` VARCHAR(191) NOT NULL COMMENT 'user id',
  MODIFY COLUMN `visitor_id` VARCHAR(191) NOT NULL COMMENT 'visitor id',
  MODIFY COLUMN `session_id` VARCHAR(191) NOT NULL COMMENT 'session id',
  MODIFY COLUMN `route_path` VARCHAR(191) NOT NULL COMMENT 'route path',
  MODIFY COLUMN `route_title` VARCHAR(191) NOT NULL COMMENT 'route title',
  MODIFY COLUMN `route_icon` VARCHAR(191) NULL COMMENT 'route icon',
  MODIFY COLUMN `visited_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'visited at';

ALTER TABLE `system_logs`
  COMMENT = 'system operation logs',
  MODIFY COLUMN `id` VARCHAR(191) NOT NULL COMMENT 'system log id',
  MODIFY COLUMN `tenant_id` VARCHAR(191) NOT NULL COMMENT 'tenant id',
  MODIFY COLUMN `operator_user_id` VARCHAR(191) NOT NULL COMMENT 'operator user id',
  MODIFY COLUMN `operator_name` VARCHAR(191) NOT NULL COMMENT 'operator name',
  MODIFY COLUMN `module` VARCHAR(191) NOT NULL COMMENT 'log module',
  MODIFY COLUMN `content` TEXT NOT NULL COMMENT 'log content',
  MODIFY COLUMN `ip_address` VARCHAR(191) NOT NULL COMMENT 'ip address',
  MODIFY COLUMN `region` VARCHAR(191) NOT NULL COMMENT 'region',
  MODIFY COLUMN `browser_version` VARCHAR(191) NOT NULL COMMENT 'browser version',
  MODIFY COLUMN `terminal_system` VARCHAR(191) NOT NULL COMMENT 'terminal system',
  MODIFY COLUMN `created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'created at',
  MODIFY COLUMN `updated_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT 'updated at';

ALTER TABLE `security_audit_logs`
  COMMENT = 'security audit logs',
  MODIFY COLUMN `id` VARCHAR(191) NOT NULL COMMENT 'security audit log id',
  MODIFY COLUMN `tenant_id` VARCHAR(191) NULL COMMENT 'tenant id',
  MODIFY COLUMN `user_id` VARCHAR(191) NULL COMMENT 'user id',
  MODIFY COLUMN `username` VARCHAR(191) NULL COMMENT 'username',
  MODIFY COLUMN `event_type` VARCHAR(191) NOT NULL COMMENT 'audit event type',
  MODIFY COLUMN `outcome` VARCHAR(191) NOT NULL COMMENT 'audit outcome',
  MODIFY COLUMN `reason_code` INTEGER NULL COMMENT 'business reason code',
  MODIFY COLUMN `reason_message` VARCHAR(191) NULL COMMENT 'business reason message',
  MODIFY COLUMN `request_method` VARCHAR(191) NULL COMMENT 'request method',
  MODIFY COLUMN `request_path` VARCHAR(191) NULL COMMENT 'request path',
  MODIFY COLUMN `ip_address` VARCHAR(191) NOT NULL COMMENT 'ip address',
  MODIFY COLUMN `browser_version` VARCHAR(191) NOT NULL COMMENT 'browser version',
  MODIFY COLUMN `terminal_system` VARCHAR(191) NOT NULL COMMENT 'terminal system',
  MODIFY COLUMN `detail` JSON NULL COMMENT 'audit detail',
  MODIFY COLUMN `created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'created at';

ALTER TABLE `users`
  COMMENT = 'system users',
  MODIFY COLUMN `id` VARCHAR(191) NOT NULL COMMENT 'user id',
  MODIFY COLUMN `tenant_id` VARCHAR(191) NOT NULL COMMENT 'tenantId',
  MODIFY COLUMN `username` VARCHAR(191) NOT NULL COMMENT 'username',
  MODIFY COLUMN `password` VARCHAR(191) NOT NULL COMMENT 'password hash',
  MODIFY COLUMN `nickname` VARCHAR(191) NULL COMMENT 'nickname',
  MODIFY COLUMN `created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'created at',
  MODIFY COLUMN `updated_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT 'updated at';

ALTER TABLE `role_menus`
  DROP FOREIGN KEY `role_menus_menu_id_fkey`;

ALTER TABLE `role_department_scopes`
  DROP FOREIGN KEY `role_department_scopes_department_id_fkey`;

ALTER TABLE `menus`
  COMMENT = 'system menus',
  MODIFY COLUMN `id` INTEGER NOT NULL AUTO_INCREMENT COMMENT 'menu id',
  MODIFY COLUMN `parent_id` INTEGER NULL COMMENT 'parent menu id',
  MODIFY COLUMN `title` VARCHAR(191) NOT NULL COMMENT 'menu title',
  MODIFY COLUMN `name` VARCHAR(191) NOT NULL COMMENT 'route name',
  MODIFY COLUMN `type` INTEGER NOT NULL COMMENT 'menu type',
  MODIFY COLUMN `path` VARCHAR(191) NOT NULL COMMENT 'menu path',
  MODIFY COLUMN `menu_key` VARCHAR(191) NOT NULL COMMENT 'menu key',
  MODIFY COLUMN `icon` VARCHAR(191) NULL COMMENT 'icon',
  MODIFY COLUMN `layout` VARCHAR(191) NULL COMMENT 'layout',
  MODIFY COLUMN `is_visible` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'is visible',
  MODIFY COLUMN `status` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'menu status',
  MODIFY COLUMN `component` VARCHAR(191) NOT NULL COMMENT 'component path',
  MODIFY COLUMN `redirect` VARCHAR(191) NULL COMMENT 'redirect path',
  MODIFY COLUMN `meta` JSON NULL COMMENT 'meta json',
  MODIFY COLUMN `sort` INTEGER NOT NULL DEFAULT 0 COMMENT 'sort order',
  MODIFY COLUMN `created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'created at',
  MODIFY COLUMN `updated_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT 'updated at';

ALTER TABLE `dictionaries`
  COMMENT = 'system dictionaries',
  MODIFY COLUMN `id` VARCHAR(191) NOT NULL COMMENT 'dictionary id',
  MODIFY COLUMN `parent_id` VARCHAR(191) NULL COMMENT 'parent dictionary id',
  MODIFY COLUMN `weight` INTEGER NOT NULL COMMENT 'weight',
  MODIFY COLUMN `name` VARCHAR(191) NOT NULL COMMENT 'dictionary name',
  MODIFY COLUMN `tenant_id` VARCHAR(191) NULL COMMENT 'tenantId',
  MODIFY COLUMN `dict_label` VARCHAR(191) NOT NULL COMMENT 'dictionary label',
  MODIFY COLUMN `dict_value` VARCHAR(191) NOT NULL COMMENT 'dictionary value',
  MODIFY COLUMN `category` VARCHAR(191) NOT NULL COMMENT 'dictionary category',
  MODIFY COLUMN `sort_code` INTEGER NOT NULL COMMENT 'sort code',
  MODIFY COLUMN `delete_flag` VARCHAR(191) NOT NULL COMMENT 'delete flag',
  MODIFY COLUMN `create_time` VARCHAR(191) NULL COMMENT 'biz create time',
  MODIFY COLUMN `create_user` VARCHAR(191) NULL COMMENT 'biz create user',
  MODIFY COLUMN `update_time` VARCHAR(191) NULL COMMENT 'biz update time',
  MODIFY COLUMN `update_user` VARCHAR(191) NULL COMMENT 'biz update user',
  MODIFY COLUMN `created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'created at',
  MODIFY COLUMN `updated_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT 'updated at';

ALTER TABLE `roles`
  COMMENT = 'system roles',
  MODIFY COLUMN `id` VARCHAR(191) NOT NULL COMMENT 'role id',
  MODIFY COLUMN `tenant_id` VARCHAR(191) NOT NULL COMMENT 'tenantId',
  MODIFY COLUMN `name` VARCHAR(191) NOT NULL COMMENT 'role name',
  MODIFY COLUMN `code` VARCHAR(191) NOT NULL COMMENT 'role code',
  MODIFY COLUMN `sort` INTEGER NOT NULL DEFAULT 0 COMMENT 'sort order',
  MODIFY COLUMN `status` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'role status',
  MODIFY COLUMN `data_scope` VARCHAR(191) NOT NULL DEFAULT 'ALL' COMMENT 'data scope',
  MODIFY COLUMN `remark` VARCHAR(191) NULL COMMENT 'remark',
  MODIFY COLUMN `created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'created at',
  MODIFY COLUMN `updated_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT 'updated at';

ALTER TABLE `departments`
  COMMENT = 'system departments',
  MODIFY COLUMN `id` INTEGER NOT NULL AUTO_INCREMENT COMMENT 'department id',
  MODIFY COLUMN `tenant_id` VARCHAR(191) NOT NULL COMMENT 'tenantId',
  MODIFY COLUMN `parent_id` INTEGER NULL COMMENT 'parent department id',
  MODIFY COLUMN `name` VARCHAR(191) NOT NULL COMMENT 'department name',
  MODIFY COLUMN `code` VARCHAR(191) NOT NULL COMMENT 'department code',
  MODIFY COLUMN `leader` VARCHAR(191) NULL COMMENT 'leader',
  MODIFY COLUMN `phone` VARCHAR(191) NULL COMMENT 'phone',
  MODIFY COLUMN `email` VARCHAR(191) NULL COMMENT 'email',
  MODIFY COLUMN `sort` INTEGER NOT NULL DEFAULT 0 COMMENT 'sort order',
  MODIFY COLUMN `status` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'department status',
  MODIFY COLUMN `remark` VARCHAR(191) NULL COMMENT 'remark',
  MODIFY COLUMN `created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'created at',
  MODIFY COLUMN `updated_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT 'updated at';

ALTER TABLE `user_roles`
  COMMENT = 'user role bindings',
  MODIFY COLUMN `tenant_id` VARCHAR(191) NOT NULL COMMENT 'tenantId',
  MODIFY COLUMN `user_id` VARCHAR(191) NOT NULL COMMENT 'user id',
  MODIFY COLUMN `role_id` VARCHAR(191) NOT NULL COMMENT 'role id',
  MODIFY COLUMN `assigned_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'assigned at';

ALTER TABLE `role_menus`
  COMMENT = 'role menu bindings',
  MODIFY COLUMN `tenant_id` VARCHAR(191) NOT NULL COMMENT 'tenantId',
  MODIFY COLUMN `role_id` VARCHAR(191) NOT NULL COMMENT 'role id',
  MODIFY COLUMN `menu_id` INTEGER NOT NULL COMMENT 'menu id',
  MODIFY COLUMN `assigned_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'assigned at';

ALTER TABLE `role_department_scopes`
  COMMENT = 'role department scope bindings',
  MODIFY COLUMN `tenant_id` VARCHAR(191) NOT NULL COMMENT 'tenantId',
  MODIFY COLUMN `role_id` VARCHAR(191) NOT NULL COMMENT 'role id',
  MODIFY COLUMN `department_id` INTEGER NOT NULL COMMENT 'department id',
  MODIFY COLUMN `assigned_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'assigned at';

ALTER TABLE `role_menus`
  ADD CONSTRAINT `role_menus_menu_id_fkey`
    FOREIGN KEY (`menu_id`) REFERENCES `menus` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

ALTER TABLE `role_department_scopes`
  ADD CONSTRAINT `role_department_scopes_department_id_fkey`
    FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

ALTER TABLE `system_configs`
  COMMENT = 'system configs',
  MODIFY COLUMN `id` VARCHAR(191) NOT NULL COMMENT 'config id',
  MODIFY COLUMN `config_key` VARCHAR(191) NOT NULL COMMENT 'config key',
  MODIFY COLUMN `config_name` VARCHAR(191) NOT NULL COMMENT 'config name',
  MODIFY COLUMN `config_value` VARCHAR(191) NOT NULL COMMENT 'config value',
  MODIFY COLUMN `config_group` VARCHAR(191) NOT NULL DEFAULT 'default' COMMENT 'config group',
  MODIFY COLUMN `value_type` VARCHAR(191) NOT NULL DEFAULT 'string' COMMENT 'value type',
  MODIFY COLUMN `is_built_in` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'built-in config flag',
  MODIFY COLUMN `is_sensitive` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'sensitive config flag',
  MODIFY COLUMN `status` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'config status',
  MODIFY COLUMN `remark` VARCHAR(191) NULL COMMENT 'remark',
  MODIFY COLUMN `created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'created at',
  MODIFY COLUMN `updated_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT 'updated at';

ALTER TABLE `notices`
  COMMENT = 'tenant notices',
  MODIFY COLUMN `id` VARCHAR(191) NOT NULL COMMENT 'notice id',
  MODIFY COLUMN `tenant_id` VARCHAR(191) NOT NULL COMMENT 'tenantId',
  MODIFY COLUMN `title` VARCHAR(191) NOT NULL COMMENT 'notice title',
  MODIFY COLUMN `content` VARCHAR(191) NOT NULL COMMENT 'notice content',
  MODIFY COLUMN `type` VARCHAR(191) NOT NULL COMMENT 'notice type',
  MODIFY COLUMN `status` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'publish status',
  MODIFY COLUMN `publish_scope` VARCHAR(191) NOT NULL DEFAULT 'TENANT_ALL' COMMENT 'notice publish scope',
  MODIFY COLUMN `target_department_ids` TEXT NULL COMMENT 'notice target department ids',
  MODIFY COLUMN `target_role_codes` TEXT NULL COMMENT 'notice target role codes',
  MODIFY COLUMN `is_pinned` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'notice pinned flag',
  MODIFY COLUMN `publisher` VARCHAR(191) NULL COMMENT 'publisher',
  MODIFY COLUMN `scheduled_publish_at` TIMESTAMP(3) NULL COMMENT 'scheduled publish at',
  MODIFY COLUMN `published_at` TIMESTAMP(3) NULL COMMENT 'published at',
  MODIFY COLUMN `event_key` VARCHAR(191) NULL COMMENT 'event key',
  MODIFY COLUMN `event_payload` TEXT NULL COMMENT 'event payload',
  MODIFY COLUMN `created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'created at',
  MODIFY COLUMN `updated_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT 'updated at';

ALTER TABLE `i18n_resources`
  COMMENT = 'i18n resources',
  MODIFY COLUMN `id` VARCHAR(191) NOT NULL COMMENT 'resource id',
  MODIFY COLUMN `language_code` VARCHAR(191) NOT NULL COMMENT 'language code',
  MODIFY COLUMN `module` VARCHAR(191) NOT NULL COMMENT 'resource module',
  MODIFY COLUMN `resource_group` VARCHAR(191) NOT NULL COMMENT 'resource group',
  MODIFY COLUMN `resource_key` VARCHAR(191) NOT NULL COMMENT 'resource key',
  MODIFY COLUMN `resource_value` TEXT NOT NULL COMMENT 'resource value',
  MODIFY COLUMN `version` INTEGER NOT NULL DEFAULT 1 COMMENT 'resource version',
  MODIFY COLUMN `status` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'resource status',
  MODIFY COLUMN `created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'created at',
  MODIFY COLUMN `updated_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT 'updated at';

ALTER TABLE `user_preferences`
  COMMENT = 'user preferences',
  MODIFY COLUMN `id` VARCHAR(191) NOT NULL COMMENT 'preference id',
  MODIFY COLUMN `tenant_id` VARCHAR(191) NOT NULL COMMENT 'tenant id',
  MODIFY COLUMN `user_id` VARCHAR(191) NOT NULL COMMENT 'user id',
  MODIFY COLUMN `layout` VARCHAR(191) NOT NULL DEFAULT 'side' COMMENT 'layout mode',
  MODIFY COLUMN `theme` VARCHAR(191) NOT NULL DEFAULT 'default' COMMENT 'theme name',
  MODIFY COLUMN `dark_mode` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'dark mode flag',
  MODIFY COLUMN `fullscreen` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'fullscreen flag',
  MODIFY COLUMN `tab_preferences` JSON NULL COMMENT 'tab preferences',
  MODIFY COLUMN `created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'created at',
  MODIFY COLUMN `updated_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT 'updated at';

ALTER TABLE `watermark_configs`
  COMMENT = 'watermark configs',
  MODIFY COLUMN `id` VARCHAR(191) NOT NULL COMMENT 'watermark config id',
  MODIFY COLUMN `tenant_id` VARCHAR(191) NULL COMMENT 'tenant id, null for system-level config',
  MODIFY COLUMN `content` VARCHAR(191) NULL COMMENT 'watermark content',
  MODIFY COLUMN `opacity` DOUBLE NULL COMMENT 'watermark opacity',
  MODIFY COLUMN `color` VARCHAR(191) NULL COMMENT 'watermark color',
  MODIFY COLUMN `font_size` INTEGER NULL COMMENT 'watermark font size',
  MODIFY COLUMN `rotation` INTEGER NULL COMMENT 'watermark rotation angle',
  MODIFY COLUMN `status` BOOLEAN NULL COMMENT 'watermark enabled status',
  MODIFY COLUMN `created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'created at',
  MODIFY COLUMN `updated_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT 'updated at';

ALTER TABLE `codegen_tables`
  COMMENT = 'code generator table metadata',
  MODIFY COLUMN `id` VARCHAR(191) NOT NULL COMMENT 'codegen table id',
  MODIFY COLUMN `table_name` VARCHAR(191) NOT NULL COMMENT 'database table name',
  MODIFY COLUMN `table_comment` VARCHAR(191) NULL COMMENT 'database table comment',
  MODIFY COLUMN `module_name` VARCHAR(191) NOT NULL COMMENT 'module name',
  MODIFY COLUMN `business_name` VARCHAR(191) NULL COMMENT 'business name',
  MODIFY COLUMN `class_name` VARCHAR(191) NULL COMMENT 'class name',
  MODIFY COLUMN `primary_key` VARCHAR(191) NULL COMMENT 'primary key column name',
  MODIFY COLUMN `created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'created at',
  MODIFY COLUMN `updated_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT 'updated at';

ALTER TABLE `codegen_columns`
  COMMENT = 'code generator column metadata',
  MODIFY COLUMN `id` VARCHAR(191) NOT NULL COMMENT 'codegen column id',
  MODIFY COLUMN `table_id` VARCHAR(191) NOT NULL COMMENT 'linked codegen table id',
  MODIFY COLUMN `column_name` VARCHAR(191) NOT NULL COMMENT 'database column name',
  MODIFY COLUMN `property_name` VARCHAR(191) NOT NULL COMMENT 'generated property name',
  MODIFY COLUMN `column_comment` VARCHAR(191) NULL COMMENT 'column comment',
  MODIFY COLUMN `ts_type` VARCHAR(191) NOT NULL DEFAULT 'string' COMMENT 'typescript type',
  MODIFY COLUMN `form_type` VARCHAR(191) NOT NULL DEFAULT 'input' COMMENT 'form widget type',
  MODIFY COLUMN `query_type` VARCHAR(191) NOT NULL DEFAULT 'none' COMMENT 'query type',
  MODIFY COLUMN `list_visible` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'whether shown in list',
  MODIFY COLUMN `sort` INTEGER NOT NULL DEFAULT 0 COMMENT 'column order',
  MODIFY COLUMN `created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'created at',
  MODIFY COLUMN `updated_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT 'updated at';
