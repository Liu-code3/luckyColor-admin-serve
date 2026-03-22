import { Injectable } from '@nestjs/common';
import {
  hashPassword,
  isPasswordHash,
  verifyPassword
} from './password.util';

@Injectable()
export class PasswordService {
  hash(plainPassword: string) {
    return hashPassword(plainPassword);
  }

  verify(passwordHash: string, plainPassword: string) {
    return verifyPassword(passwordHash, plainPassword);
  }

  isHash(value: string) {
    return isPasswordHash(value);
  }
}
