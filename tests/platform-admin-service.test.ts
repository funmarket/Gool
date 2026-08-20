import assert from 'node:assert/strict';
import test from 'node:test';
import type {
  PlatformAdminRepository,
  PlatformRole,
} from '../apps/api/src/modules/platform-admin/application/platform-admin.repository.js';
import { PlatformAdminService } from '../apps/api/src/modules/platform-admin/application/platform-admin.service.js';

class FakePlatformAdminRepository implements PlatformAdminRepository {
  constructor(private readonly activeRolesByUserId: ReadonlyMap<string, readonly PlatformRole[]>) {}

  getActiveRoles(userId: string): Promise<PlatformRole[]> {
    return Promise.resolve([...(this.activeRolesByUserId.get(userId) ?? [])]);
  }
}

function serviceWithActiveAdmin() {
  return new PlatformAdminService(
    new FakePlatformAdminRepository(
      new Map<string, readonly PlatformRole[]>([['platform-admin', ['PLATFORM_ADMIN']]]),
    ),
  );
}

test('Platform Admin authority accepts an active PLATFORM_ADMIN assignment', async () => {
  const service = serviceWithActiveAdmin();

  assert.deepEqual(await service.getActiveRoles('platform-admin'), ['PLATFORM_ADMIN']);
  assert.equal(await service.isPlatformAdmin('platform-admin'), true);
  await assert.doesNotReject(() => service.requirePlatformAdmin('platform-admin'));
});

test('Platform Admin authority rejects a user without an active platform role', async () => {
  const service = serviceWithActiveAdmin();

  assert.equal(await service.isPlatformAdmin('normal-user'), false);
  await assert.rejects(
    () => service.requirePlatformAdmin('normal-user'),
    (error: unknown) =>
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      error.status === 403 &&
      'code' in error &&
      error.code === 'PLATFORM_ADMIN_REQUIRED',
  );
});

test('Community owner authority alone does not grant Platform Admin authority', async () => {
  const service = serviceWithActiveAdmin();

  assert.equal(await service.isPlatformAdmin('community-owner'), false);
  await assert.rejects(
    () => service.requirePlatformAdmin('community-owner'),
    (error: unknown) =>
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'PLATFORM_ADMIN_REQUIRED',
  );
});

test('Community admin authority alone does not grant Platform Admin authority', async () => {
  const service = serviceWithActiveAdmin();

  assert.equal(await service.isPlatformAdmin('community-admin'), false);
  await assert.rejects(
    () => service.requirePlatformAdmin('community-admin'),
    (error: unknown) =>
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'PLATFORM_ADMIN_REQUIRED',
  );
});

test('Revoked Platform Admin authority is treated as absent by the active-role boundary', async () => {
  const service = new PlatformAdminService(
    new FakePlatformAdminRepository(
      new Map<string, readonly PlatformRole[]>([
        ['active-admin', ['PLATFORM_ADMIN']],
        ['revoked-admin', []],
      ]),
    ),
  );

  assert.equal(await service.isPlatformAdmin('active-admin'), true);
  assert.equal(await service.isPlatformAdmin('revoked-admin'), false);
  await assert.rejects(
    () => service.requirePlatformAdmin('revoked-admin'),
    (error: unknown) =>
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'PLATFORM_ADMIN_REQUIRED',
  );
});
