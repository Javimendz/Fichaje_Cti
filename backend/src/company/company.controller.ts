// src/empresas/empresas.controller.ts
// --- Controlador para la gestión de Empresas ---
import { 
  Controller, Get, Post, Body, Patch, Param, Delete, 
  UseGuards, ParseIntPipe, Put, Req 
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
// Auth & Roles
import { JwtAuthGuard } from 'auth/guards/jwt-auth.guard';
import { RolesGuard } from 'auth/guards/roles.guard';
import { Roles } from 'auth/decorators/roles.decorator';
import { UserRole } from 'auth/roles.enum';
import { GetUser } from 'auth/decorators/get-user.decorator';
import type { UserPayload } from 'auth/interfaces/user-payload.interface';
import { SetupCompanyDto } from './dto/setup-company.dto';

// Nota: Se ha eliminado el endpoint POST raíz para crear empresa, ya que ahora se gestiona a través de "crear-empresa" con un DTO específico que incluye la creación del Admin asociado. Esto mejora la claridad y seguridad del proceso de creación de empresas.
// El endpoint "crear-empresa" es el único método para crear una empresa, y solo puede ser accedido por un SuperAdmin. Este método también se encarga de crear un usuario Admin asociado a la empresa, garantizando que cada empresa tenga al menos un Admin desde su creación.
// El endpoint "list-empresas" ahora incluye un log de auditoría que registra el email, ID y rol del usuario que solicita el listado de empresas. Esto es útil para monitorear el acceso a información sensible y detectar posibles actividades no autorizadas.
// El endpoint "find/:id" y "update/:id" siguen siendo accesibles solo para SuperAdmin, ya que la gestión de empresas es una tarea crítica que debe ser controlada estrictamente.
// El controlador delega toda la lógica de negocio y validación al CompanyService, manteniendo el controlador limpio y enfocado en manejar las solicitudes HTTP y la seguridad de acceso.

// --- Controlador para la gestión de Empresas ---
/**
 * * CompanyController
 * * Gestiona el ciclo de vida de las empresas. La seguridad de "empresaId" y 
 * * jerarquía de roles se delega al CompanyService para mantener el controlador limpio.    
 * * Endpoints:
 * * - POST /empresa/crear-empresa: Crea una nueva empresa junto con un usuario Admin asociado. Solo accesible por SuperAdmin.
 * * - GET /empresa/list-empresas: Lista todas las empresas. Accesible por SuperAdmin y Admin (filtrado por empresa).
 */
@Controller('empresa')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompanyController {
  constructor(private readonly empresasService: CompanyService) {}

  // --- NUEVO MÉTODO CREAR EMPRESA ---
  /**
   * 
   * * @param setupEmpresaDto DTO que incluye datos de la empresa y del Admin a crear 
   * * @returns La empresa creada junto con el usuario Admin asociado
   * 
   * * Este endpoint es el único método para crear una empresa, y solo puede ser accedido por un SuperAdmin. Este método también se encarga de crear un usuario Admin asociado a la empresa, garantizando que cada empresa tenga al menos un Admin desde su creación.    
   */
  @Post('crear-empresa')
  @Roles(UserRole.SUPERADMIN) // Solo el SuperAdmin puede crear Empresa + Admin
  async setupEmpresa(@Body() setupEmpresaDto: SetupCompanyDto) {
    return this.empresasService.createWithAdmin(setupEmpresaDto);
  }

  /*@Post('crear-empresa')
  @Roles(UserRole.SUPERADMIN)
  create(@Body() createEmpresaDto: CreateEmpresaDto) {
    return this.empresasService.create(createEmpresaDto);
  }
*/

// --- LISTAR EMPRESAS ---
// El endpoint "list-empresas" ahora incluye un log de auditoría que registra el email, ID y rol del usuario que solicita el listado de empresas. Esto es útil para monitorear el acceso a información sensible y detectar posibles actividades no autorizadas.
/**
 * 
 * *@param user Usuario autenticado que realiza la solicitud. Se utiliza para validar el acceso a las empresas y para registrar un log de auditoría con su email, ID y rol. 
 * *@returns Lista de empresas a las que el usuario tiene acceso (todas para SuperAdmin, solo la suya para Admin).
 * 
 * Este endpoint permite a los SuperAdmin listar todas las empresas, mientras que los Admin solo pueden ver la empresa a la que pertenecen. El método delega la lógica de filtrado y validación al CompanyService, manteniendo el controlador limpio.
 *  
 */
@Get('list-empresas')
@Roles(UserRole.SUPERADMIN)
findAll(@GetUser() user: UserPayload) { 
  // 1. Cambiamos userId por id
  // 2. Usamos el email que ahora sí tenemos disponible
  console.log(`[Audit] Listado de empresas solicitado por: ${user.email} (ID: ${user.id}) (Rol: ${user.rol})`);
  
  return this.empresasService.findAll(user);
}
  // --- OBTENER EMPRESA POR ID ---
  /**
   * * @param id ID de la empresa a obtener. Se valida que sea un número entero mediante ParseIntPipe.
   *  * @param user Usuario autenticado que realiza la solicitud. Se utiliza para validar que el usuario tiene acceso a la empresa solicitada.
   * * @returns La empresa solicitada. Si la empresa no existe o el usuario no tiene acceso, se lanzará una excepción que será manejada por el CompanyService.
   * 
   * Este endpoint es accesible solo para SuperAdmin, ya que la gestión de empresas es una tarea crítica que debe ser controlada estrictamente. El método delega toda la lógica de validación y obtención de la empresa al CompanyService, manteniendo el controlador enfocado en manejar la solicitud HTTP y la seguridad de acceso.
   */ 
  @Get('find/:id')
  @Roles(UserRole.SUPERADMIN)
  findOne(
    @Param('id', ParseIntPipe) id: number, 
    @GetUser() user: UserPayload
  ) {
    return this.empresasService.findOne(id, user);
  }

  // --- ACTUALIZAR EMPRESA ---
  /**
   * * @param id ID de la empresa a actualizar. Se valida que sea un número entero mediante ParseIntPipe.
   * * @param updateEmpresaDto DTO con los datos a actualizar de la empresa.
   * * @returns La empresa actualizada. Si la empresa no existe o no se puede actualizar, se lanzará una excepción que será manejada por el CompanyService. 
   * * Este endpoint es accesible solo para SuperAdmin, ya que la gestión de empresas es una tarea crítica que debe ser controlada estrictamente. El método delega toda la lógica de validación y actualización al CompanyService, manteniendo el controlador enfocado en manejar la solicitud HTTP y la seguridad de acceso.
   */
  @Put('update/:id')
  @Roles(UserRole.SUPERADMIN)
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateEmpresaDto: UpdateCompanyDto,
    @GetUser() user: UserPayload
  ) {
    return this.empresasService.update(id, updateEmpresaDto, user);
  }

  // --- BORRAR EMPRESA ---
  // Eliminar una empresa es una acción crítica que solo debe ser realizada por un SuperAdmin. Este endpoint se encarga de eliminar la empresa especificada por su ID. La lógica de eliminación, incluyendo la validación de que la empresa existe y la gestión de las relaciones (como usuarios asociados), se delega al CompanyService para mantener el controlador limpio.
/**
 *  * @param id ID de la empresa a eliminar. Se valida que sea un número entero mediante ParseIntPipe.
 * * @returns Resultado de la operación de eliminación. Si la empresa no existe o no se puede eliminar, se lanzará una excepción que será manejada por el CompanyService.
 * 
 * Este endpoint es accesible solo para SuperAdmin, ya que la eliminación de una empresa es una acción crítica que puede afectar a muchos usuarios y datos asociados. El método delega toda la lógica de validación y eliminación al CompanyService, manteniendo el controlador enfocado en manejar la solicitud HTTP y la seguridad de acceso.
 * 
 */
  @Delete('delete/:id')
  @Roles(UserRole.SUPERADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.empresasService.remove(id);
  }

  @Put('settings/archive')
@Roles(UserRole.ADMIN)
async updateArchiveSettings(
  @GetUser() user: UserPayload,
  @Body() dto: UpdateCompanyDto
) {
  return await this.empresasService.update(user.empresaId, dto, user);
}
}