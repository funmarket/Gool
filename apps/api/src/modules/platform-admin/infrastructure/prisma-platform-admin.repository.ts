import type { DatabaseClient } from '../../../infrastructure/database/prisma.js';
import type {
  PlatformAdminRepository,
  PlatformRole,
} from '../application/platform-admin.repository.js';

export class PrismaPlatformAdminRepository implements PlatformAdminRepository {
  constructor(private readonly db: DatabaseClient) {}

  async getActiveRoles(userId: string): Promise<PlatformRole[]> {
    const assignments = await this.db.platformRoleAssignment.findMany({
      where: { userId, revokedAt: null },
      select: { role: true },
    });

    return assignments.map((assignment) => assignment.role);
  }
}
