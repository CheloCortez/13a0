import type { Major } from '$lib/data/types';
import type { Rng } from './rng';
import { historicTeamStrength } from './strength';
import type { TournamentTeam } from './tournament';

const OPPONENT_COUNT = 15;

/** Sorteia 15 times históricos distintos para disputar o Major contra o usuário. */
export function buildOpponents(majors: Major[], rng: Rng): TournamentTeam[] {
	const opponents: TournamentTeam[] = [];
	const used = new Set<string>();

	while (opponents.length < OPPONENT_COUNT) {
		const major = majors[rng.int(majors.length)];
		const team = major.teams[rng.int(major.teams.length)];
		const id = `${major.id}/${team.id}`;
		if (used.has(id)) continue;
		used.add(id);
		opponents.push({
			id,
			name: `${team.name} ${major.year}`,
			strength: historicTeamStrength(team)
		});
	}

	return opponents;
}
