import type { Major, Team } from '$lib/data/types';
import type { Rng } from './rng';
import { dynastyBonus, historicTeamStrength } from './strength';
import type { TournamentTeam } from './tournament';

const OPPONENT_COUNT = 15;

// Times que mudaram de nome mas pertencem à mesma organização (para contar títulos juntos)
const ORG_ALIASES: Record<string, string> = {
	luminosity: 'sk'
};
const orgId = (teamId: string) => ORG_ALIASES[teamId] ?? teamId;

/**
 * Sorteia 15 times históricos distintos para disputar o Major contra o usuário.
 * No modo difícil (`championsOnly`), o campo inteiro é formado só por campeões de Major.
 */
export function buildOpponents(majors: Major[], rng: Rng, championsOnly = false): TournamentTeam[] {
	const champCounts = new Map<string, number>();
	for (const major of majors) {
		const champ = major.teams.find((t) => t.placement === 'Campeão');
		if (champ) {
			const id = orgId(champ.id);
			champCounts.set(id, (champCounts.get(id) ?? 0) + 1);
		}
	}

	// Pool restrito aos campeões para o modo difícil (um campeão por major).
	const champPool = championsOnly
		? majors.flatMap((major) => {
				const team = major.teams.find((t) => t.placement === 'Campeão');
				return team ? [{ major, team }] : [];
			})
		: [];

	const opponents: TournamentTeam[] = [];
	const used = new Set<string>();

	while (opponents.length < OPPONENT_COUNT) {
		let major: Major;
		let team: Team;
		if (championsOnly) {
			({ major, team } = champPool[rng.int(champPool.length)]);
		} else {
			major = majors[rng.int(majors.length)];
			team = major.teams[rng.int(major.teams.length)];
		}
		const id = `${major.id}/${team.id}`;
		if (used.has(id)) continue;
		used.add(id);
		const bonus = team.placement === 'Campeão' ? dynastyBonus(champCounts.get(orgId(team.id)) ?? 0) : 1.0;
		opponents.push({
			id,
			name: `${team.name} ${major.year}`,
			strength: historicTeamStrength(team) * bonus,
			players: team.players.map((p) => ({ nick: p.nick, rating: p.rating }))
		});
	}

	return opponents;
}
