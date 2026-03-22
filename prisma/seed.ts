import { Prisma, PrismaClient } from '../src/generated/prisma';
import { departmentSeedData } from './seed-data/department.data';
import { dictTreeData } from './seed-data/dict-tree.data';
import { menuSeedData } from './seed-data/menu.data';
import { noticeSeedData } from './seed-data/notice.data';
import { roleSeedData } from './seed-data/role.data';
import { systemConfigSeedData } from './seed-data/system-config.data';

interface DictionarySeedNode {
  id: string;
  parentId: string;
  weight: number;
  name: string;
  tenantId?: string;
  dictLabel: string;
  dictValue: string;
  category: string;
  sortCode: number;
  deleteFlag: string;
  createTime?: string;
  createUser?: string;
  updateTime?: string;
  updateUser?: string;
  children?: DictionarySeedNode[];
}

const prisma = new PrismaClient();

async function main() {
  const dictionaryRows = flattenDictionaryNodes(
    dictTreeData.data as DictionarySeedNode[]
  );

  await prisma.notice.deleteMany();
  await prisma.systemConfig.deleteMany();
  await prisma.department.deleteMany();
  await prisma.role.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.dictionary.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      username: 'admin',
      password: '123456',
      nickname: '系统管理员'
    }
  });

  await prisma.role.createMany({
    data: roleSeedData
  });

  await prisma.department.createMany({
    data: departmentSeedData
  });

  await prisma.systemConfig.createMany({
    data: systemConfigSeedData
  });

  await prisma.notice.createMany({
    data: noticeSeedData
  });

  await prisma.menu.createMany({
    data: menuSeedData.map((item) => ({
      id: item.id,
      parentId: item.parentId,
      title: item.title,
      name: item.name,
      type: item.type,
      path: item.path,
      menuKey: item.menuKey,
      icon: item.icon,
      layout: item.layout,
      isVisible: item.isVisible,
      component: item.component,
      redirect: null,
      meta: (item.meta ?? undefined) as Prisma.InputJsonValue | undefined,
      sort: item.sort
    }))
  });

  await prisma.dictionary.createMany({
    data: dictionaryRows
  });
}

function flattenDictionaryNodes(nodes: DictionarySeedNode[]) {
  const result: Array<{
    id: string;
    parentId: string | null;
    weight: number;
    name: string;
    tenantId: string | null;
    dictLabel: string;
    dictValue: string;
    category: string;
    sortCode: number;
    deleteFlag: string;
    createTime: string | null;
    createUser: string | null;
    updateTime: string | null;
    updateUser: string | null;
  }> = [];

  const walk = (items: DictionarySeedNode[]) => {
    items.forEach((item) => {
      result.push({
        id: item.id,
        parentId: item.parentId === '0' ? null : item.parentId,
        weight: item.weight,
        name: item.name,
        tenantId: item.tenantId ?? null,
        dictLabel: item.dictLabel,
        dictValue: item.dictValue,
        category: item.category,
        sortCode: item.sortCode,
        deleteFlag: item.deleteFlag,
        createTime: item.createTime ?? null,
        createUser: item.createUser ?? null,
        updateTime: item.updateTime ?? null,
        updateUser: item.updateUser ?? null
      });

      if (item.children?.length) {
        walk(item.children);
      }
    });
  };

  walk(nodes);
  return result;
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
