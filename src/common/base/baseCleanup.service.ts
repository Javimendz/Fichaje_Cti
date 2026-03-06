import { ICleanableEntity } from 'common/interfaces/cleanable.entity.interface';
import { Repository, LessThan, In } from 'typeorm';

export abstract class BaseCleanupService<T extends ICleanableEntity> {
  constructor(
    protected readonly repository: Repository<T>,
    private readonly loggerName: string,
  ) {}

  /**
   * Lógica compartida para archivar registros
   * @param days Días de antigüedad
   * @param targetStatus Estado o lista de estados a procesar
   */
  async cleanOldRecords(days: number, targetStatus: any | any[]) {
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - days);

    // Si pasamos un solo estado, lo convertimos en array para usar 'In' de TypeORM
    const statusCondition = Array.isArray(targetStatus) ? In(targetStatus) : targetStatus;

    console.log(`--- [CRON ${this.loggerName}] Escaneando registros antiguos... ---`);

    const recordsToHide = await this.repository.find({
      where: {
        estado: statusCondition,
        updatedAt: LessThan(limitDate),
      } as any,
    });

    if (recordsToHide.length > 0) {
      await this.repository.softRemove(recordsToHide);
      console.log(`✅ [${this.loggerName}] Se han ocultado ${recordsToHide.length} registros.`);
    } else {
      console.log(`ℹ️ [${this.loggerName}] Nada que archivar hoy.`);
    }
  }
}