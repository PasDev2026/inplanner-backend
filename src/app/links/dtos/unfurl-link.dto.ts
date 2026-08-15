import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UnfurlLinkDto {
  @ApiProperty({
    example: 'https://example.com/article',
    description: 'URL a inspeccionar',
  })
  @IsString()
  @IsNotEmpty()
  url: string;
}

export class UnfurlResponseDto {
  @ApiProperty({
    example: 'https://example.com/article',
    description: 'URL final tras redirecciones',
  })
  url: string;

  @ApiProperty({ example: 'example.com', description: 'Dominio de la URL' })
  domain: string;

  @ApiProperty({
    example: 'Example Domain',
    description: 'Titulo de la pagina o dominio como fallback',
  })
  title: string;

  @ApiProperty({
    example: 'https://example.com/favicon.ico',
    description: 'URL del icono del sitio (favicon real o generico)',
  })
  icon: string;
}
