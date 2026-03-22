ALTER TABLE `role_department_scopes`
  DROP FOREIGN KEY `role_department_scopes_department_id_fkey`;

ALTER TABLE `departments`
  MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'department id';

ALTER TABLE `role_department_scopes`
  ADD CONSTRAINT `role_department_scopes_department_id_fkey`
    FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

ALTER TABLE `role_menus`
  DROP FOREIGN KEY `role_menus_menu_id_fkey`;

ALTER TABLE `menus`
  MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'menu id';

ALTER TABLE `role_menus`
  ADD CONSTRAINT `role_menus_menu_id_fkey`
    FOREIGN KEY (`menu_id`) REFERENCES `menus` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE;
