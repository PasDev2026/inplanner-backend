import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TransformInterceptor } from './transform.interceptor';
import { of } from 'rxjs';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<unknown>;

  function mockReflector(skip: boolean): Reflector {
    return {
      getAllAndOverride: jest.fn().mockReturnValue(skip),
    } as unknown as Reflector;
  }

  beforeEach(() => {
    interceptor = new TransformInterceptor(mockReflector(false));
  });

  function mockContext(): ExecutionContext {
    return {
      switchToHttp: () => ({}),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;
  }

  it('should wrap simple responses in success/data/timestamp', (done) => {
    const data = { id: 1, name: 'test' };
    const callHandler = { handle: () => of(data) };

    interceptor.intercept(mockContext(), callHandler).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        data,
        timestamp: expect.any(String) as string,
      });
      done();
    });
  });

  it('should extract data and meta for paginated responses', (done) => {
    const paginatedData = {
      data: [{ id: 1 }, { id: 2 }],
      meta: { total: 2, page: 1, pageSize: 10 },
    };
    const callHandler = { handle: () => of(paginatedData) };

    interceptor.intercept(mockContext(), callHandler).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        data: paginatedData.data,
        meta: paginatedData.meta,
        timestamp: expect.any(String) as string,
      });
      done();
    });
  });

  it('should handle null data', (done) => {
    const callHandler = { handle: () => of(null) };

    interceptor.intercept(mockContext(), callHandler).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        data: null,
        timestamp: expect.any(String) as string,
      });
      done();
    });
  });

  it('should pass through untouched when @SkipTransform is set', (done) => {
    interceptor = new TransformInterceptor(mockReflector(true));
    const raw = Buffer.from('xlsx-bytes');
    const callHandler = { handle: () => of(raw) };

    interceptor.intercept(mockContext(), callHandler).subscribe((result) => {
      expect(result).toBe(raw);
      done();
    });
  });
});
