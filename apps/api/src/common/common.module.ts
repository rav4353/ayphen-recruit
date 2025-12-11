import { Global, Module } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class CommonModule { }
