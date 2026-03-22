export const departmentSeedData = [
  {
    id: 100,
    parentId: null,
    name: '总部',
    code: 'headquarters',
    leader: '张总',
    phone: '13800000000',
    email: 'hq@luckycolor.local',
    sort: 1,
    status: true,
    remark: '平台总部组织'
  },
  {
    id: 110,
    parentId: 100,
    name: '产品研发部',
    code: 'product_rd',
    leader: '李工',
    phone: '13800000001',
    email: 'rd@luckycolor.local',
    sort: 10,
    status: true,
    remark: '负责产品设计与研发'
  },
  {
    id: 120,
    parentId: 100,
    name: '运营支持部',
    code: 'operations_support',
    leader: '王敏',
    phone: '13800000002',
    email: 'ops@luckycolor.local',
    sort: 20,
    status: true,
    remark: '负责客户运营与交付支持'
  }
];
