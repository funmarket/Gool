export type PlatformRole = 'PLATFORM_ADMIN';

export interface PlatformAdminRepository {
  getActiveRoles(userId: string): Promise<PlatformRole[]>;
}
