import { Controller, Get, Query, StreamableFile } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ReportsService } from './reports.service';
import { QueryReportDto } from './dtos/query-report.dto';
import { SkipTransform } from '../../common/decorators/skip-transform.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/auth-types';

@ApiTags('Reportes')
@ApiBearerAuth('access-token')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('activities')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Reporte de actividades',
    description:
      'Lista paginada de actividades (tareas con su proyecto) con filtros',
  })
  getActivities(
    @Query() query: QueryReportDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reportsService.getActivities(query, user);
  }

  @Get('activities/export')
  @SkipTransform()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({
    summary: 'Exportar actividades a Excel',
    description: 'Descarga .xlsx con todas las actividades según filtros',
  })
  async exportActivities(
    @Query() query: QueryReportDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<StreamableFile> {
    const buffer = await this.reportsService.exportActivities(query, user);
    return new StreamableFile(buffer, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment; filename="actividades.xlsx"',
    });
  }
}
