export const systemConfigSeedData = [
  {
    configKey: 'sys.default_tenant_mode',
    configName: 'Default Tenant Mode',
    configValue: 'isolated',
    configGroup: 'tenant',
    valueType: 'string',
    isBuiltIn: true,
    isSensitive: false,
    status: true,
    remark: 'Default tenant isolation mode'
  },
  {
    configKey: 'sys.default_locale',
    configName: 'Default Locale',
    configValue: 'zh-CN',
    configGroup: 'appearance',
    valueType: 'string',
    isBuiltIn: true,
    isSensitive: false,
    status: true,
    remark: 'Default locale for the admin app'
  },
  {
    configKey: 'sys.enable_watermark',
    configName: 'Enable Watermark',
    configValue: 'true',
    configGroup: 'appearance',
    valueType: 'boolean',
    isBuiltIn: true,
    isSensitive: false,
    status: true,
    remark: 'Controls watermark visibility'
  },
  {
    configKey: 'sys.login.captcha_secret',
    configName: 'Login Captcha Secret',
    configValue: 'captcha-secret-demo',
    configGroup: 'login',
    valueType: 'string',
    isBuiltIn: true,
    isSensitive: true,
    status: true,
    remark: 'Secret used by login captcha service'
  }
];
