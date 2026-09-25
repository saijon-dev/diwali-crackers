import { describe, expect, it } from 'vitest';
import { roleGuard } from './role.guard';

describe('RoleGuard', () => {

  it('should be defined', () => {
    expect(roleGuard).toBeDefined();
  });

});
