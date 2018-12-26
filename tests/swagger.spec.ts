import { Swagger } from '../src/index';

test('hoge', () => {
  expect(1).toBe(1);

  const s = new Swagger();
  expect(s).toBeTruthy();
});
