import type {
  TeamChallengeCreateInput,
  TeamChallengeMessageCreateInput,
  TeamCreateInput,
  TeamLineupCreateInput,
  TeamPlayerCreateInput,
  TeamUpdateInput,
} from '@hooma/contracts';
import { AppError } from '../../../http/errors/app-error.js';
import type { TeamListInput, TeamRepository } from './team-repository.js';

export class TeamService {
  constructor(private readonly repo: TeamRepository) {}

  listPublic(input: TeamListInput) {
    return this.repo.listPublic(input);
  }

  managedTeams(userId: string) {
    return this.repo.listManagedTeams(userId);
  }

  async getPublic(teamId: string) {
    const team = await this.repo.getPublic(teamId);
    if (!team) throw new AppError(404, 'TEAM_NOT_FOUND', 'Team not found.');
    return team;
  }

  async getChallenge(userId: string, challengeId: string) {
    const teamIds = await this.repo.getManagedTeamIds(userId);
    return this.repo.getChallenge(challengeId, teamIds);
  }

  async getGame(userId: string, gameId: string) {
    return this.repo.getGame(gameId);
  }

  async create(userId: string, input: TeamCreateInput) {
    await this.requireCanCreateTeam(userId, input.communityId);
    return this.repo.create(userId, input);
  }

  async update(userId: string, teamId: string, input: TeamUpdateInput) {
    await this.requireCanManageTeam(userId, teamId);
    return this.repo.update(teamId, input);
  }

  async addPlayer(userId: string, teamId: string, input: TeamPlayerCreateInput) {
    await this.requireCanManageTeamLineup(userId, teamId);
    return this.repo.addPlayer(teamId, input);
  }

  async createLineup(userId: string, teamId: string, input: TeamLineupCreateInput) {
    await this.requireCanManageTeamLineup(userId, teamId);
    return this.repo.createLineup(userId, teamId, input);
  }

  async createChallenge(userId: string, input: TeamChallengeCreateInput) {
    if (input.challengerTeamId === input.challengedTeamId) {
      throw new AppError(400, 'TEAM_CHALLENGE_SELF', 'A team cannot challenge itself.');
    }
    await this.requireCanManageTeamChallenges(userId, input.challengerTeamId);
    return this.repo.createChallenge(userId, input);
  }

  async incomingChallenges(userId: string, limit = 30) {
    const teamIds = await this.repo.getManagedTeamIds(userId);
    return this.repo.listIncomingChallenges(teamIds, Math.min(limit, 100));
  }

  async outgoingChallenges(userId: string, limit = 30) {
    const teamIds = await this.repo.getManagedTeamIds(userId);
    return this.repo.listOutgoingChallenges(teamIds, Math.min(limit, 100));
  }

  async acceptChallenge(userId: string, challengeId: string) {
    const teamIds = await this.repo.getManagedTeamIds(userId);
    return this.repo.acceptChallenge(userId, challengeId, teamIds);
  }

  async declineChallenge(userId: string, challengeId: string) {
    const teamIds = await this.repo.getManagedTeamIds(userId);
    return this.repo.declineChallenge(userId, challengeId, teamIds);
  }

  async cancelChallenge(userId: string, challengeId: string) {
    const teamIds = await this.repo.getManagedTeamIds(userId);
    return this.repo.cancelChallenge(userId, challengeId, teamIds);
  }

  async games(userId: string, limit = 30) {
    const teamIds = await this.repo.getManagedTeamIds(userId);
    return this.repo.listGames(teamIds, Math.min(limit, 100));
  }

  async messages(userId: string, challengeId: string) {
    const teamIds = await this.repo.getManagedTeamIds(userId);
    return this.repo.listMessages(challengeId, teamIds);
  }

  async createMessage(userId: string, challengeId: string, input: TeamChallengeMessageCreateInput) {
    const teamIds = await this.repo.getManagedTeamIds(userId);
    return this.repo.createMessage(userId, challengeId, teamIds, input);
  }

  private async requireCanCreateTeam(userId: string, communityId: string) {
    const access = await this.repo.getCommunityCoachAccess(userId, communityId);
    if (!access) {
      throw new AppError(403, 'TEAM_COACH_REQUIRED', 'Coach access required for this HOOMA.');
    }
    return access;
  }

  private async requireCanManageTeam(userId: string, teamId: string) {
    const access = await this.repo.getTeamManagerAccess(userId, teamId);
    if (!access) throw new AppError(404, 'TEAM_NOT_FOUND', 'Team not found.');
    return access;
  }

  private requireCanManageTeamChallenges(userId: string, teamId: string) {
    return this.requireCanManageTeam(userId, teamId);
  }

  private requireCanManageTeamLineup(userId: string, teamId: string) {
    return this.requireCanManageTeam(userId, teamId);
  }
}
