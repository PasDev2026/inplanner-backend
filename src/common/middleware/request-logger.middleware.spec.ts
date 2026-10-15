import { redactSensitiveQuery } from './request-logger.middleware';

describe('redactSensitiveQuery', () => {
  it('redacta el valor del query param token', () => {
    expect(redactSensitiveQuery('/api/v1/mcp?token=secreto123&x=1')).toBe(
      '/api/v1/mcp?token=***&x=1',
    );
  });

  it('redacta access_token y api_key', () => {
    expect(redactSensitiveQuery('/r?access_token=abc&api_key=def')).toBe(
      '/r?access_token=***&api_key=***',
    );
  });

  it('no modifica URLs sin parámetros sensibles', () => {
    expect(redactSensitiveQuery('/api/v1/mcp?page=1')).toBe(
      '/api/v1/mcp?page=1',
    );
  });
});
