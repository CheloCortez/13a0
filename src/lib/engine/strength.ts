import type { DraftedPlayer, Team } from '$lib/data/types';

const OUT_OF_ROLE_PENALTY = 0.85;
const NO_AWP_PENALTY = 0.92;
const NO_IGL_PENALTY = 0.9;
const SYNERGY_BONUS = 1.03;

function isNatural(p: DraftedPlayer): boolean {
	return p.slot === p.role || p.slot === p.role2;
}

/** Rating do jogador no slot escalado; fora de função sofre penalidade. */
export function effectiveRating(p: DraftedPlayer): number {
	return isNatural(p) ? p.rating : p.rating * OUT_OF_ROLE_PENALTY;
}

/**
 * Força do time draftado: média dos ratings efetivos, com penalidades de
 * composição (sem AWPer/IGL de ofício) e bônus de sinergia (colegas de
 * elenco histórico).
 */
export function teamStrength(players: DraftedPlayer[]): number {
	let strength = players.reduce((sum, p) => sum + effectiveRating(p), 0) / players.length;

	const naturalIn = (role: 'awp' | 'igl') =>
		players.some((p) => p.slot === role && isNatural(p));
	if (!naturalIn('awp')) strength *= NO_AWP_PENALTY;
	if (!naturalIn('igl')) strength *= NO_IGL_PENALTY;

	const squads = new Set<string>();
	let synergy = false;
	for (const p of players) {
		const key = `${p.majorId}/${p.teamName}`;
		if (squads.has(key)) synergy = true;
		squads.add(key);
	}
	if (synergy) strength *= SYNERGY_BONUS;

	return strength;
}

/** Força de um time histórico adversário: média simples dos ratings. */
export function historicTeamStrength(team: Team): number {
	return team.players.reduce((sum, p) => sum + p.rating, 0) / team.players.length;
}
