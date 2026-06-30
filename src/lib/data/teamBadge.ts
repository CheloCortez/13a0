import type { DraftedPlayer, Major } from './types';
import { teamLogos } from './teamLogos';

/** Resolve o teamId de origem cruzando majorId + teamName (fallback p/ saves sem teamId). */
export function resolveTeamId(
	majors: Major[],
	majorId: string,
	teamName: string
): string | undefined {
	const major = majors.find((m) => m.id === majorId);
	return major?.teams.find((t) => t.name === teamName)?.id;
}

/** teamId a usar no badge: o persistido, ou o resolvido por nome (saves antigos). */
export function badgeTeamId(majors: Major[], pick: DraftedPlayer): string | undefined {
	return pick.teamId ?? resolveTeamId(majors, pick.majorId, pick.teamName);
}

/** Ano do Major de origem, para o badge do time. */
export function majorYear(majors: Major[], majorId: string): number | undefined {
	return majors.find((m) => m.id === majorId)?.year;
}

/** Arquivo do logo do time de origem (em static/teamlogos/), ou undefined se não houver. */
export function teamLogoFor(majors: Major[], pick: DraftedPlayer): string | undefined {
	const teamId = badgeTeamId(majors, pick);
	return teamId ? teamLogos[`${pick.majorId}/${teamId}`] : undefined;
}
