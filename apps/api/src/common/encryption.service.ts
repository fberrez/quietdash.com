import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { ENCRYPTION } from '@quietdash/shared';

@Injectable()
export class EncryptionService {
  private readonly algorithm = ENCRYPTION.ALGORITHM;
  private readonly keyLength = ENCRYPTION.KEY_LENGTH;
  private readonly ivLength = ENCRYPTION.IV_LENGTH;
  private readonly encryptionKey: Buffer;

  constructor(private configService: ConfigService) {
    const key = this.configService.get<string>('ENCRYPTION_KEY');
    if (!key || key.length !== this.keyLength) {
      throw new Error(
        `ENCRYPTION_KEY must be exactly ${this.keyLength} characters long`,
      );
    }
    this.encryptionKey = Buffer.from(key, 'utf-8');
  }

  encrypt(text: string): { encryptedData: string; iv: string; authTag: string } {
    // Generate random IV
    const iv = crypto.randomBytes(this.ivLength);

    // Create cipher
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.encryptionKey,
      iv,
    );

    // Encrypt
    let encrypted = cipher.update(text, 'utf-8', 'hex');
    encrypted += cipher.final('hex');

    // Get auth tag
    const authTag = cipher.getAuthTag();

    return {
      encryptedData: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  decrypt(encryptedData: string, iv: string, authTag: string): string {
    // Create decipher
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.encryptionKey,
      Buffer.from(iv, 'hex'),
    );

    // Set auth tag
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    // Decrypt
    let decrypted = decipher.update(encryptedData, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');

    return decrypted;
  }
}
