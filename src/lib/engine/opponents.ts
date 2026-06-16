import type { Major } from '$lib/data/types';
import type { Rng } from './rng';
import { dynastyBonus, historicTeamStrength } from './strength';
import type { TournamentTeam } from './tournament';

const OPPONENT_COUNT = 15;

// Times que mudaram de nome mas pertencem à mesma organização (para contar títulos juntos)
const ORG_ALIASES: Record<string, string> = {
	luminosity: 'sk'
};
const orgId = (teamId: string) => ORG_ALIASES[teamId] ?? teamId;

/** Sorteia 15 times históricos distintos para disputar o Major contra o usuário. */
export function buildOpponents(majors: Major[], rng: Rng): TournamentTeam[] {
	const champCounts = new Map<string, number>();
	for (const major of majors) {
		const champ = major.teams.find((t) => t.placement === 'Campeão');
		if (champ) {
			const id = orgId(champ.id);
			champCounts.set(id, (champCounts.get(id) ?? 0) + 1);
		}
	}

	const opponents: TournamentTeam[] = [];
	const used = new Set<string>();

	while (opponents.length < OPPONENT_COUNT) {
		const major = majors[rng.int(majors.length)];
		const team = major.teams[rng.int(major.teams.length)];
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
