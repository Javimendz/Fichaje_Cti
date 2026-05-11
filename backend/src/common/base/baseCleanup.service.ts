import { ICleanableEntity } from '../../common/interfaces/cleanable.entity.interface';
import { Repository, LessThan, In } from 'typeorm';

export abstract class BaseCleanupService<T extends ICleanableEntity> {
  constructor(
    protected readonly repository: Repository<T>,
    private readonly loggerName: string,
  ) {}

  async cleanOldRecords(days: number, targetStatus: any | any[], empresaId: number) {
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - days);

    const statusCondition = Array.isArray(targetStatus) ? In(targetStatus) : targetStatus;

    // Solo buscamos registros de la empresa específica
    const recordsToHide = await this.repository.find({
      where: {
        empresaId, //  Filtro vital para multi-empresa
        estado: statusCondition,
        updatedAt: LessThan(limitDate),
      } as any,
    });

    if (recordsToHide.length > 0) {
      await this.repository.softRemove(recordsToHide);
      console.log(` [${this.loggerName}] Empresa ID ${empresaId}: Ocultados ${recordsToHide.length} registros (antigüedad: ${days} días).`);
    }
  }
}