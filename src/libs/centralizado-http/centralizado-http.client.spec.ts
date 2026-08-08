import { HttpException } from '@nestjs/common';
import { CentralizadoHttpClient } from './centralizado-http.client';

describe('CentralizadoHttpClient', () => {
  let client: CentralizadoHttpClient;

  beforeEach(() => {
    client = new CentralizadoHttpClient();
  });

  function mockFetch(status: number, body: unknown): jest.SpyInstance {
    return jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: jest.fn().mockResolvedValue(body),
    } as unknown as Response);
  }

  it('preserva el mensaje array de errores de validación', async () => {
    mockFetch(400, {
      statusCode: 400,
      message: [
        'Debe contener mayúscula, minúscula, número y carácter especial',
      ],
      error: 'Bad Request',
    });

    await expect(
      client.patch('/auth/change-password', {}),
    ).rejects.toMatchObject({
      response: {
        message: [
          'Debe contener mayúscula, minúscula, número y carácter especial',
        ],
        statusCode: 400,
      },
    });
  });

  it('preserva el mensaje string', async () => {
    mockFetch(400, {
      statusCode: 400,
      message: 'La contraseña actual es incorrecta',
      error: 'Bad Request',
    });

    await expect(
      client.patch('/auth/change-password', {}),
    ).rejects.toMatchObject({
      response: {
        message: 'La contraseña actual es incorrecta',
        statusCode: 400,
      },
    });
  });

  it('usa error como fallback sin message', async () => {
    mockFetch(503, { statusCode: 503, error: 'Bad Gateway' });

    await expect(client.get('/health')).rejects.toMatchObject({
      response: { message: 'Bad Gateway', statusCode: 503 },
    });
  });

  it('usa mensaje por defecto sin message ni error', async () => {
    mockFetch(400, {});

    await expect(
      client.patch('/auth/change-password', {}),
    ).rejects.toMatchObject({
      response: { message: 'Error en servicio centralizado', statusCode: 400 },
    });
  });

  it('lanza HttpException', async () => {
    mockFetch(400, {
      statusCode: 400,
      message: 'La contraseña actual es incorrecta',
    });

    const promise = client.patch('/auth/change-password', {});
    await expect(promise).rejects.toBeInstanceOf(HttpException);
  });
});
