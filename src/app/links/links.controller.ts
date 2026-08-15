import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { LinksService } from './links.service';
import { UnfurlLinkDto, UnfurlResponseDto } from './dtos/unfurl-link.dto';

@ApiTags('Links')
@ApiBearerAuth('access-token')
@Controller('links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post('unfurl')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Obtener titulo e icono de una URL',
    description:
      'Inspecciona una URL publica y devuelve titulo, dominio e icono del sitio',
  })
  @ApiResponse({
    status: 201,
    description: 'Metadata de la URL',
    type: UnfurlResponseDto,
  })
  unfurl(@Body() dto: UnfurlLinkDto): Promise<UnfurlResponseDto> {
    return this.linksService.unfurl(dto);
  }
}
