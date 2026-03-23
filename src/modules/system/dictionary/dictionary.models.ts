import type { Dictionary } from '../../../generated/prisma';

export type DictionaryNode = Omit<Dictionary, 'parentId'> & {
  parentId: string;
  children?: DictionaryNode[];
};

export interface DictionaryOptionItem {
  label: string;
  value: string;
  children?: DictionaryOptionItem[];
}

export type DictionaryTypeNode = DictionaryNode;
export type DictionaryItemNode = DictionaryNode;
