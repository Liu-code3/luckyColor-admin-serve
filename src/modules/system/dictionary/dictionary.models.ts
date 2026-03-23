import type { Dictionary } from '../../../generated/prisma';

export type DictionaryNode = Omit<
  Dictionary,
  'parentId' | 'createdAt' | 'updatedAt'
> & {
  parentId: string;
  children?: DictionaryNode[];
};

export type DictionaryTypeNode = DictionaryNode;
export type DictionaryItemNode = DictionaryNode;
