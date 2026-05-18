import { isSwaggerEnabled } from '../../src/config/swagger.setup';

describe('isSwaggerEnabled', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('desactiva Swagger en producción por defecto', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ENABLE_SWAGGER;
    expect(isSwaggerEnabled()).toBe(false);
  });

  it('activa Swagger con ENABLE_SWAGGER=true en producción', () => {
    process.env.NODE_ENV = 'production';
    process.env.ENABLE_SWAGGER = 'true';
    expect(isSwaggerEnabled()).toBe(true);
  });

  it('activa Swagger en desarrollo por defecto', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.ENABLE_SWAGGER;
    expect(isSwaggerEnabled()).toBe(true);
  });
});
