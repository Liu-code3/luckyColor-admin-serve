interface MenuSeedItem {
  id: number;
  parentId: number | null;
  title: string;
  name: string;
  type: number;
  path: string;
  menuKey: string;
  icon: string;
  layout: string;
  isVisible: boolean;
  component: string;
  meta?: Record<string, unknown>;
  sort: number;
}

export const menuSeedData: MenuSeedItem[] = [
  {
    id: 1,
    parentId: null,
    title: '首页',
    name: 'indexIndex',
    type: 1,
    path: '/index',
    menuKey: 'main_analysis',
    icon: 'pajamas:overview',
    layout: '',
    isVisible: true,
    component: 'index/index',
    sort: 1
  },
  {
    id: 2,
    parentId: null,
    title: '系统总览',
    name: 'analysis',
    type: 1,
    path: '/systemOverview',
    menuKey: 'main_analysis',
    icon: 'pajamas:overview',
    layout: '',
    isVisible: true,
    component: 'sys',
    sort: 2
  },
  {
    id: 3,
    parentId: 2,
    title: '核心技术',
    name: 'mainIndex',
    type: 2,
    path: '/systemOverview/index',
    menuKey: 'main_analysis_technology',
    icon: 'ri:coreos-fill',
    layout: '',
    isVisible: true,
    component: 'sys/overview/index',
    sort: 3
  },
  {
    id: 4,
    parentId: null,
    title: '系统管理',
    name: 'system',
    type: 1,
    path: '/systemManagement',
    menuKey: 'main_system',
    icon: 'material-symbols:folder-managed-sharp',
    layout: '',
    isVisible: true,
    component: 'sys',
    sort: 4
  },
  {
    id: 5,
    parentId: 4,
    title: '用户管理',
    name: 'systemUsers',
    type: 2,
    path: '/systemManagement/system/users',
    menuKey: 'main_system_users',
    icon: 'mdi:user',
    layout: '',
    isVisible: true,
    component: 'sys/user',
    sort: 5
  },
  {
    id: 6,
    parentId: 4,
    title: '部门管理',
    name: 'department',
    type: 2,
    path: '/systemManagement/system/department',
    menuKey: 'main_system_department',
    icon: 'mingcute:department-fill',
    layout: '',
    isVisible: true,
    component: 'sys/department/department',
    sort: 6
  },
  {
    id: 7,
    parentId: 4,
    title: '菜单管理',
    name: 'menu',
    type: 2,
    path: '/systemManagement/system/menu',
    menuKey: 'main_system_menu',
    icon: 'line-md:menu',
    layout: '',
    isVisible: true,
    component: 'sys/menu/index',
    meta: {
      keepAlive: true
    },
    sort: 7
  },
  {
    id: 8,
    parentId: 4,
    title: '角色管理',
    name: 'systemRole',
    type: 2,
    path: '/systemManagement/system/role',
    menuKey: 'main_system_role',
    icon: 'eos-icons:role-binding-outlined',
    layout: '',
    isVisible: true,
    component: 'sys/role/index',
    sort: 8
  },
  {
    id: 9,
    parentId: null,
    title: '组件封装',
    name: 'icomponent',
    type: 1,
    path: '/icomponent',
    menuKey: 'main',
    icon: 'iconoir:commodity',
    layout: '',
    isVisible: true,
    component: 'icomponent',
    sort: 9
  },
  {
    id: 10,
    parentId: 9,
    title: '富文本编辑器',
    name: 'editor',
    type: 2,
    path: '/icomponent/editor',
    menuKey: 'icomponent_editor',
    icon: 'bi:file-earmark-richtext',
    layout: '',
    isVisible: true,
    component: 'icomponent/editor',
    meta: {
      keepAlive: true
    },
    sort: 10
  },
  {
    id: 11,
    parentId: 9,
    title: '数据字典',
    name: 'dict',
    type: 2,
    path: '/icomponent/dict',
    menuKey: 'icomponent_dict',
    icon: 'arcticons:colordict',
    layout: '',
    isVisible: true,
    component: 'icomponent/dict/index',
    meta: {
      keepAlive: true
    },
    sort: 11
  },
  {
    id: 12,
    parentId: 9,
    title: '编辑表格',
    name: 'editTablist',
    type: 2,
    path: '/icomponent/editTablist',
    menuKey: 'icomponent_editTablist',
    icon: 'arcticons:colordict',
    layout: '',
    isVisible: true,
    component: 'icomponent/editTablist/index',
    meta: {
      keepAlive: true
    },
    sort: 12
  },
  {
    id: 13,
    parentId: 4,
    title: '配置管理',
    name: 'systemConfig',
    type: 2,
    path: '/systemManagement/system/config',
    menuKey: 'main_system_config',
    icon: 'solar:settings-bold',
    layout: '',
    isVisible: true,
    component: 'sys/config/index',
    meta: {
      title: '配置管理',
      keepAlive: true
    },
    sort: 9
  },
  {
    id: 14,
    parentId: 4,
    title: '公告管理',
    name: 'systemNotice',
    type: 2,
    path: '/systemManagement/system/notice',
    menuKey: 'main_system_notice',
    icon: 'mdi:bullhorn-outline',
    layout: '',
    isVisible: true,
    component: 'sys/notice/index',
    meta: {
      title: '公告管理',
      keepAlive: true
    },
    sort: 10
  },
  {
    id: 15,
    parentId: 4,
    title: '租户管理',
    name: 'systemTenant',
    type: 2,
    path: '/systemManagement/system/tenant',
    menuKey: 'main_system_tenant',
    icon: 'mdi:office-building-cog-outline',
    layout: '',
    isVisible: true,
    component: 'sys/tenant/index',
    meta: {
      title: '租户管理',
      keepAlive: true
    },
    sort: 11
  },
  {
    id: 16,
    parentId: 4,
    title: '租户套餐',
    name: 'systemTenantPackage',
    type: 2,
    path: '/systemManagement/system/tenantPackage',
    menuKey: 'main_system_tenant_package',
    icon: 'mdi:package-variant-closed',
    layout: '',
    isVisible: true,
    component: 'sys/tenantPackage/index',
    meta: {
      title: '租户套餐',
      keepAlive: true
    },
    sort: 12
  }
];
