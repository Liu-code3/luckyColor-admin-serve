import { flattenDictionaryNodes } from '../../prisma/seed.helpers';
import {
  DEFAULT_TENANT_ID,
  LOCAL_ADMIN_SEED,
  REQUIRED_BOOTSTRAP_DICT_VALUES,
  REQUIRED_BOOTSTRAP_MENU_KEYS,
  REQUIRED_BOOTSTRAP_ROLE_CODES,
  TENANT_ADMIN_DATA_SCOPE_DEPARTMENT_IDS,
  TENANT_ADMIN_MENU_IDS,
  TENANT_MEMBER_MENU_IDS
} from '../../prisma/seed-manifest';
import { departmentSeedData } from '../../prisma/seed-data/department.data';
import { dictTreeData } from '../../prisma/seed-data/dict-tree.data';
import { menuSeedData } from '../../prisma/seed-data/menu.data';
import { roleSeedData } from '../../prisma/seed-data/role.data';

describe('seed bootstrap', () => {
  it('keeps a default local admin account for one-click setup', () => {
    expect(LOCAL_ADMIN_SEED).toMatchObject({
      tenantId: 'tenant_001',
      username: 'admin',
      password: '123456'
    });
  });

  it('contains required bootstrap roles and menus', () => {
    const roleCodes = roleSeedData.map((item) => item.code);
    const menuKeys = menuSeedData.map((item) => item.menuKey);

    expect(roleCodes).toEqual(
      expect.arrayContaining([...REQUIRED_BOOTSTRAP_ROLE_CODES])
    );
    expect(menuKeys).toEqual(
      expect.arrayContaining([...REQUIRED_BOOTSTRAP_MENU_KEYS])
    );
  });

  it('contains required bootstrap dictionaries', () => {
    const dictValues = flattenDictionaryNodes(dictTreeData.data).map(
      (item) => item.dictValue
    );

    expect(dictValues).toEqual(
      expect.arrayContaining([...REQUIRED_BOOTSTRAP_DICT_VALUES])
    );
  });

  it('keeps menu and department assignments aligned with bootstrap data', () => {
    const menuIds = menuSeedData.map((item) => item.id);
    const departmentIds = departmentSeedData.map((item) => item.id);

    expect(LOCAL_ADMIN_SEED.tenantId).toBe(DEFAULT_TENANT_ID);
    expect(departmentIds).toContain(LOCAL_ADMIN_SEED.departmentId);
    expect(menuIds).toEqual(
      expect.arrayContaining([...TENANT_ADMIN_MENU_IDS])
    );
    expect(menuIds).toEqual(
      expect.arrayContaining([...TENANT_MEMBER_MENU_IDS])
    );
    expect(departmentIds).toEqual(
      expect.arrayContaining([...TENANT_ADMIN_DATA_SCOPE_DEPARTMENT_IDS])
    );
  });
});
