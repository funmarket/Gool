export interface BalancePlayer {
  id: string;
  name: string;
  rating: number;
  preferredPositions: string[];
}

export interface BalancedTeam {
  key: string;
  totalRating: number;
  players: BalancePlayer[];
}

interface TeamState extends BalancedTeam {
  positionCounts: Map<string, number>;
}

interface PositionGroup {
  position: string | null;
  players: BalancePlayer[];
}

function primaryPosition(player: BalancePlayer): string | null {
  const position = player.preferredPositions[0];
  return position && position !== 'ANY' ? position : null;
}

function sortPlayersByRating(players: BalancePlayer[]): BalancePlayer[] {
  return [...players].sort((a, b) => b.rating - a.rating || a.id.localeCompare(b.id));
}

function groupPlayersByPrimaryPosition(players: BalancePlayer[]): PositionGroup[] {
  const groups = new Map<string | null, BalancePlayer[]>();

  for (const player of players) {
    const position = primaryPosition(player);
    const group = groups.get(position);

    if (group) {
      group.push(player);
    } else {
      groups.set(position, [player]);
    }
  }

  return [...groups.entries()]
    .map(([position, group]) => ({
      position,
      players: sortPlayersByRating(group),
    }))
    .sort((a, b) => {
      const highestRatingDifference = (b.players[0]?.rating ?? 0) - (a.players[0]?.rating ?? 0);
      if (highestRatingDifference !== 0) return highestRatingDifference;

      return (a.position ?? '\uffff').localeCompare(b.position ?? '\uffff');
    });
}

export function balanceTeams(players: BalancePlayer[], teamCount = 2): BalancedTeam[] {
  const teams: TeamState[] = Array.from({ length: Math.max(2, teamCount) }, (_, index) => ({
    key: String.fromCharCode(65 + index),
    totalRating: 0,
    players: [],
    positionCounts: new Map<string, number>(),
  }));

  for (const group of groupPlayersByPrimaryPosition(players)) {
    for (const player of group.players) {
      teams.sort((a, b) => {
        if (group.position) {
          const positionDifference =
            (a.positionCounts.get(group.position) ?? 0) -
            (b.positionCounts.get(group.position) ?? 0);
          if (positionDifference !== 0) return positionDifference;
        }

        const sizeDifference = a.players.length - b.players.length;
        if (sizeDifference !== 0) return sizeDifference;

        const ratingDifference = a.totalRating - b.totalRating;
        if (ratingDifference !== 0) return ratingDifference;

        return a.key.localeCompare(b.key);
      });

      const target = teams[0];
      if (!target) continue;

      target.players.push(player);
      target.totalRating += player.rating;

      if (group.position) {
        target.positionCounts.set(
          group.position,
          (target.positionCounts.get(group.position) ?? 0) + 1,
        );
      }
    }
  }

  return teams
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((team) => ({
      key: team.key,
      totalRating: team.totalRating,
      players: team.players,
    }));
}
