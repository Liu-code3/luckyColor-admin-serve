import {
  ROLE_DATA_SCOPE_ALL,
  ROLE_DATA_SCOPE_CUSTOM,
  ROLE_DATA_SCOPE_VALUES,
  SUPER_ADMIN_ROLE_CODE
} from './access.constants';
import {
  MENU_TREE_VIEW_TENANT,
  MENU_TYPE_BUTTON,
  MENU_TYPE_DIRECTORY,
  MENU_TYPE_VALUES
} from './menu.constants';
import {
  NOTICE_STATUS_DRAFT,
  NOTICE_STATUS_PUBLISHED,
  TENANT_STATUS_ACTIVE,
  TENANT_STATUS_FROZEN,
  TENANT_STATUS_VALUES
} from './status.constants';

describe('shared constants', () => {
  it('exposes stable access domains', () => {
    expect(SUPER_ADMIN_ROLE_CODE).toBe('super_admin');
    expect(ROLE_DATA_SCOPE_VALUES).toEqual([
      ROLE_DATA_SCOPE_ALL,
      'DEPARTMENT',
      'DEPARTMENT_AND_CHILDREN',
      'SELF',
      ROLE_DATA_SCOPE_CUSTOM
    ]);
  });

  it('exposes stable menu domains', () => {
    expect(MENU_TYPE_VALUES).toEqual([
      MENU_TYPE_DIRECTORY,
      2,
      MENU_TYPE_BUTTON
    ]);
    expect(MENU_TREE_VIEW_TENANT).toBe('tenant');
  });

  it('exposes stable status domains', () => {
    expect(TENANT_STATUS_VALUES).toEqual([
      TENANT_STATUS_ACTIVE,
      'DISABLED',
      TENANT_STATUS_FROZEN
    ]);
    expect(NOTICE_STATUS_DRAFT).toBe(false);
    expect(NOTICE_STATUS_PUBLISHED).toBe(true);
  });
});
