export const MENU_TYPE_DIRECTORY = 1;
export const MENU_TYPE_MENU = 2;
export const MENU_TYPE_BUTTON = 3;

export const MENU_TYPE_VALUES = [
  MENU_TYPE_DIRECTORY,
  MENU_TYPE_MENU,
  MENU_TYPE_BUTTON
] as const;

export type MenuType = (typeof MENU_TYPE_VALUES)[number];

export const MENU_TREE_VIEW_PLATFORM = 'platform';
export const MENU_TREE_VIEW_TENANT = 'tenant';

export const MENU_TREE_VIEW_VALUES = [
  MENU_TREE_VIEW_PLATFORM,
  MENU_TREE_VIEW_TENANT
] as const;

export type MenuTreeView = (typeof MENU_TREE_VIEW_VALUES)[number];
