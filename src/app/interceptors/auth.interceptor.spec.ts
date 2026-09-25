import { describe, expect, it } from 'vitest';
import { authInterceptor } from './auth.interceptor';

describe('AuthInterceptor', () => {

  it('should be defined', () => {
    expect(authInterceptor).toBeDefined();
  });

});
