import type { Prisma } from '../../generated/prisma';

export const LIST_SORT_ORDER_VALUES = ['asc', 'desc'] as const;

export type ListSortOrder = (typeof LIST_SORT_ORDER_VALUES)[number];

type SortablePrimitive = string | number | boolean | Date | null | undefined;

export function resolveSortOrder(sortOrder?: ListSortOrder): Prisma.SortOrder {
  return sortOrder === 'asc' ? 'asc' : 'desc';
}

export function compareSortableValues(
  left: SortablePrimitive,
  right: SortablePrimitive,
  sortOrder: ListSortOrder = 'asc'
) {
  if (left === right) {
    return 0;
  }

  if (left === null || left === undefined) {
    return 1;
  }

  if (right === null || right === undefined) {
    return -1;
  }

  const normalizedLeft = normalizeSortableValue(left);
  const normalizedRight = normalizeSortableValue(right);

  if (normalizedLeft === normalizedRight) {
    return 0;
  }

  const result = normalizedLeft < normalizedRight ? -1 : 1;
  return sortOrder === 'desc' ? result * -1 : result;
}

export function sortCollection<T>(
  records: readonly T[],
  selector: (record: T) => SortablePrimitive,
  sortOrder: ListSortOrder = 'asc',
  tieBreaker?: (left: T, right: T) => number
) {
  return [...records].sort((left, right) => {
    const compared = compareSortableValues(
      selector(left),
      selector(right),
      sortOrder
    );

    if (compared !== 0) {
      return compared;
    }

    return tieBreaker ? tieBreaker(left, right) : 0;
  });
}

function normalizeSortableValue(value: Exclude<SortablePrimitive, null | undefined>) {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'string') {
    return value.toLocaleLowerCase('zh-CN');
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  return value;
}
