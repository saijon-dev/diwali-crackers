import { describe, expect, it } from 'vitest';
import { authGuard } from './auth.guard';

describe('AuthGuard', () => {

  it('should be defined', () => {
    expect(authGuard).toBeDefined();
  });

});
