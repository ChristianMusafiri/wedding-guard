import { Module, Global } from '@nestjs/common';
import { SecurityService } from './security.service';

@Global() // nous en aurrons besoins à plusieurs endroits
@Module({
  providers: [SecurityService],
  exports: [SecurityService]
})
export class SecurityModule {}
