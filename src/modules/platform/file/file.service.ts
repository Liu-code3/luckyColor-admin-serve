import { Injectable } from '@nestjs/common';
import { constants as fsConstants } from 'node:fs';
import { access, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { BusinessException } from '../../../shared/api/business.exception';
import { BUSINESS_ERROR_CODES } from '../../../shared/api/error-codes';

@Injectable()
export class FileService {
  private readonly uploadDir = path.resolve(process.cwd(), 'storage', 'uploads');

  async ensureUploadDir() {
    await mkdir(this.uploadDir, { recursive: true });
  }

  getUploadDir() {
    return this.uploadDir;
  }

  getPublicUrl(filename: string) {
    return `/api/file/${encodeURIComponent(filename)}`;
  }

  async saveUploadedFile(file: { originalname: string; buffer: Buffer }) {
    await this.ensureUploadDir();

    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const safeName = baseName.replace(/[^a-zA-Z0-9_-]/g, '-');
    const filename = `${Date.now()}-${safeName}${ext}`;
    const filePath = path.join(this.uploadDir, filename);

    await writeFile(filePath, file.buffer);

    return {
      name: file.originalname,
      filename,
      url: this.getPublicUrl(filename)
    };
  }

  async resolveFilePath(filename: string) {
    await this.ensureUploadDir();
    const normalizedName = path.basename(decodeURIComponent(filename));
    const filePath = path.join(this.uploadDir, normalizedName);
    await this.assertFileExists(filePath);
    return filePath;
  }

  async deleteByPath(filePath: string) {
    const normalizedPath = this.normalizeDeleteTarget(filePath);
    const targetPath = path.join(this.uploadDir, normalizedPath);

    await this.assertFileExists(targetPath);
    await rm(targetPath);
    return true;
  }

  private normalizeDeleteTarget(filePath: string) {
    const decodedPath = decodeURIComponent(filePath).trim();

    try {
      const url = new URL(decodedPath, 'http://127.0.0.1');
      return path.basename(url.pathname);
    } catch {
      return path.basename(decodedPath);
    }
  }

  private async assertFileExists(filePath: string) {
    try {
      await access(filePath, fsConstants.F_OK);
    } catch {
      throw new BusinessException(BUSINESS_ERROR_CODES.FILE_NOT_FOUND);
    }
  }
}
