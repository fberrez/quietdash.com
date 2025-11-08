import { Module } from '@nestjs/common';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';
import { EncryptionService } from '../common/encryption.service';

@Module({
  controllers: [ApiKeysController],
  providers: [ApiKeysService, EncryptionService],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
