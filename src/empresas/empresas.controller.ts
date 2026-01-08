import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete,
  UseGuards 
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EmpresasService } from './empresas.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { RolesGuard } from 'auth/guards/roles.guard';
import { Roles } from 'auth/decorators/roles.decorator';
import { UserRole } from 'auth/roles.enum';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('empresas')
export class EmpresasController {
  constructor(private readonly empresasService: EmpresasService) {}

  @Post()
  @Roles(UserRole.SUPERADMIN)
  create(@Body() createEmpresaDto: CreateEmpresaDto) {
    return this.empresasService.create(createEmpresaDto);
  }

  @Get()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  findAll() {
    return this.empresasService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.empresasService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPERADMIN)
  update(@Param('id') id: string, @Body() updateEmpresaDto: UpdateEmpresaDto) {
    return this.empresasService.update(id, updateEmpresaDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPERADMIN)
  remove(@Param('id') id: string) {
    return this.empresasService.remove(id);
  }
}