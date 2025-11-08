import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';
import { ApiKeySafe, DecryptedApiKey } from '@vitrine/shared';

@Injectable()
export class ApiKeysService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) {}

  async create(
    userId: string,
    createApiKeyDto: CreateApiKeyDto,
  ): Promise<ApiKeySafe> {
    const { provider, apiKey } = createApiKeyDto;

    // Check if API key for this provider already exists
    const existing = await this.prisma.apiKey.findUnique({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `API key for provider ${provider} already exists`,
      );
    }

    // Encrypt the API key
    const { encryptedData, iv, authTag } =
      this.encryptionService.encrypt(apiKey);

    // Store in database
    const created = await this.prisma.apiKey.create({
      data: {
        userId,
        provider,
        encryptedKey: encryptedData,
        iv,
        authTag,
      },
    });

    return this.sanitizeApiKey(created);
  }

  async findAll(userId: string): Promise<ApiKeySafe[]> {
    const apiKeys = await this.prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return apiKeys.map((key) => this.sanitizeApiKey(key));
  }

  async findOne(userId: string, id: string): Promise<ApiKeySafe> {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { id, userId },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    return this.sanitizeApiKey(apiKey);
  }

  async update(
    userId: string,
    id: string,
    updateApiKeyDto: UpdateApiKeyDto,
  ): Promise<ApiKeySafe> {
    const existing = await this.prisma.apiKey.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('API key not found');
    }

    // Encrypt the new API key
    const { encryptedData, iv, authTag } = this.encryptionService.encrypt(
      updateApiKeyDto.apiKey,
    );

    // Update in database
    const updated = await this.prisma.apiKey.update({
      where: { id },
      data: {
        encryptedKey: encryptedData,
        iv,
        authTag,
      },
    });

    return this.sanitizeApiKey(updated);
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.apiKey.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('API key not found');
    }

    await this.prisma.apiKey.delete({
      where: { id },
    });
  }

  async getDecryptedApiKey(
    userId: string,
    provider: string,
  ): Promise<DecryptedApiKey | null> {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    });

    if (!apiKey) {
      return null;
    }

    const decryptedKey = this.encryptionService.decrypt(
      apiKey.encryptedKey,
      apiKey.iv,
      apiKey.authTag,
    );

    return {
      id: apiKey.id,
      provider: apiKey.provider as any,
      apiKey: decryptedKey,
    };
  }

  private sanitizeApiKey(apiKey: any): ApiKeySafe {
    const { encryptedKey, iv, authTag, ...safe } = apiKey;
    return safe;
  }
}
