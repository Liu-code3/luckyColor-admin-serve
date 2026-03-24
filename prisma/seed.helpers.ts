export interface DictionarySeedNode {
  id: string;
  parentId: string;
  weight: number;
  name: string;
  tenantId?: string;
  dictLabel: string;
  dictValue: string;
  category: string;
  sortCode: number;
  status?: boolean;
  deleteFlag: string;
  createTime?: string;
  createUser?: string;
  updateTime?: string;
  updateUser?: string;
  children?: DictionarySeedNode[];
}

export function flattenDictionaryNodes(nodes: DictionarySeedNode[]) {
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
    status: boolean;
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
        status: item.status ?? true,
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
