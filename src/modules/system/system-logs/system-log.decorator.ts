import { SetMetadata } from '@nestjs/common';

export type SystemLogTargetSource = 'body' | 'param' | 'query';
export type SystemLogSensitiveValue = string | number | boolean;

export interface SystemLogTarget {
  source: SystemLogTargetSource;
  key: string;
  label?: string;
}

export interface SystemLogSensitiveRule {
  source: SystemLogTargetSource;
  key: string;
  equals?: SystemLogSensitiveValue;
}

export interface SystemLogOptions {
  module: string;
  action: string;
  targets?: SystemLogTarget[];
  sensitive?: boolean | SystemLogSensitiveRule;
}

export const SYSTEM_LOG_METADATA = 'system_log_metadata';

export const SystemLog = (options: SystemLogOptions) =>
  SetMetadata(SYSTEM_LOG_METADATA, options);
