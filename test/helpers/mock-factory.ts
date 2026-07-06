export type Mockify<T extends object> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? jest.Mock<R, A, void>
    : T[K];
};

export function createMock<T extends object>(methods: (keyof T)[]): Mockify<T> {
  const mock = {} as Mockify<T>;
  for (const method of methods) {
    mock[method] = jest.fn() as unknown as Mockify<T>[keyof T];
  }
  return mock;
}
