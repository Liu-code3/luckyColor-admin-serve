import { SetMetadata } from '@nestjs/common';

export type SystemLogTargetSource = 'body' | 'param' | 'query';

export interface SystemLogTarget {
  source: SystemLogTargetSource;
  key: string;
  label?: string;
}

export interface SystemLogOptions {
  module: string;
  action: string;
  targets?: SystemLogTarget[];
}

export const SYSTEM_LOG_METADATA = 'system_log_metadata';

export const SystemLog = (options: SystemLogOptions) =>
  SetMetadata(SYSTEM_LOG_METADATA, options);
