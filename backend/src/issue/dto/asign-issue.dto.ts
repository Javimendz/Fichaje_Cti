import { IsNumber, IsNotEmpty } from 'class-validator';

export class AssignIssueDto {
  @IsNumber()
  @IsNotEmpty()
  assignedToId: number;
}