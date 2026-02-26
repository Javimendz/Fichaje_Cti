import { Module } from '@nestjs/common';
import { IssueService } from './issue.service';
import { IncidenciaController } from './issue.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Issue } from './entities/issue.entity';

@Module({
  imports: [
      TypeOrmModule.forFeature([Issue])

  ],
  controllers: [IncidenciaController],
  providers: [IssueService],
  exports: [IssueService]
})
export class IssueModule {}
