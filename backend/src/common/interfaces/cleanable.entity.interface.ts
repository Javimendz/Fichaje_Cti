export interface ICleanableEntity {
  id: number;
  updatedAt: Date;
  deletedAt?: Date;
  empresaId: number;
  estado: any; // Usamos any porque Issue usa boolean y Request usa Enum
}