export const systemConfigSeedData = [
  {
    configKey: 'sys.default_tenant_mode',
    configName: '默认租户模式',
    configValue: 'isolated',
    valueType: 'string',
    status: true,
    remark: '新租户默认采用隔离模式'
  },
  {
    configKey: 'sys.default_locale',
    configName: '默认语言',
    configValue: 'zh-CN',
    valueType: 'string',
    status: true,
    remark: '系统默认国际化语言'
  },
  {
    configKey: 'sys.enable_watermark',
    configName: '是否启用水印',
    configValue: 'true',
    valueType: 'boolean',
    status: true,
    remark: '控制后台水印能力开关'
  }
];
