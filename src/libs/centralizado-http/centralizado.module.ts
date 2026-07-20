import { Global, Module } from '@nestjs/common';
import { CentralizadoHttpClient } from './centralizado-http.client';

@Global()
@Module({
  providers: [CentralizadoHttpClient],
  exports: [CentralizadoHttpClient],
})
export class CentralizadoHttpModule {}
