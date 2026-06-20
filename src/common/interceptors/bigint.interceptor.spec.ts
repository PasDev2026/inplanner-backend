import { ExecutionContext } from '@nestjs/common';
import { BigIntInterceptor } from './bigint.interceptor';
import { of } from 'rxjs';

describe('BigIntInterceptor', () => {
  let interceptor: BigIntInterceptor;

  beforeEach(() => {
    interceptor = new BigIntInterceptor();
  });

  function mockContext(): ExecutionContext {
    return {
      switchToHttp: () => ({}),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;
  }

  it('should convert BigInt to string', (done) => {
    const data = { value: BigInt(42) };
    const callHandler = { handle: () => of(data) };

    interceptor.intercept(mockContext(), callHandler).subscribe((result) => {
      expect(result).toEqual({ value: '42' });
      done();
    });
  });

  it('should convert Date to ISO string', (done) => {
    const date = new Date('2026-01-15T00:00:00.000Z');
    const data = { createdAt: date };
    const callHandler = { handle: () => of(data) };

    interceptor.intercept(mockContext(), callHandler).subscribe((result) => {
      expect(result).toEqual({ createdAt: date.toISOString() });
      done();
    });
  });

  it('should handle nested objects', (done) => {
    const data = { a: BigInt(1), b: { c: BigInt(2) } };
    const callHandler = { handle: () => of(data) };

    interceptor.intercept(mockContext(), callHandler).subscribe((result) => {
      expect(result).toEqual({ a: '1', b: { c: '2' } });
      done();
    });
  });

  it('should pass null, undefined, and primitives unchanged', (done) => {
    const data = {
      a: null,
      b: undefined,
      c: 'hello',
      d: 42,
      e: true,
      f: [1, 2],
    };
    const callHandler = { handle: () => of(data) };

    interceptor.intercept(mockContext(), callHandler).subscribe((result) => {
      expect(result).toEqual({
        a: null,
        b: undefined,
        c: 'hello',
        d: 42,
        e: true,
        f: [1, 2],
      });
      done();
    });
  });

  it('should handle arrays of objects', (done) => {
    const data = [{ id: BigInt(1) }, { id: BigInt(2) }];
    const callHandler = { handle: () => of(data) };

    interceptor.intercept(mockContext(), callHandler).subscribe((result) => {
      expect(result).toEqual([{ id: '1' }, { id: '2' }]);
      done();
    });
  });
});
