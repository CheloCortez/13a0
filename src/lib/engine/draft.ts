import type { DraftedPlayer, Major, Role, Team } from '$lib/data/types';
import { Rng } from './rng';
import { resolveRoles } from './strength';

export type GameMode = 'classic' | 'almanac';

/** Ordem canônica das funções (exibição). */
export const DRAFT_ORDER: Role[] = ['awp', 'igl', 'entry', 'lurker', 'support'];

export const REROLLS: Record<GameMode, number> = { classic: 3, almanac: 1 };

export interface DraftOffer {
	majorId: string;
	majorName: string;
	year: number;
	team: Team;
}

/** Estado serializável do draft (vai para localStorage). */
export interface DraftState {
	seed: number;
	mode: GameMode;
	round: number;
	rerollsLeft: number;
	usedTeamKeys: string[];
	offer: DraftOffer | null;
	picks: DraftedPlayer[];
	rngState: number;
}

function offerKey(offer: DraftOffer): string {
	return `${offer.majorId}/${offer.team.id}`;
}

function rollOffer(majors: Major[], used: string[], rng: Rng): DraftOffer {
	for (;;) {
		const major = majors[rng.int(majors.length)];
		const team = major.teams[rng.int(major.teams.length)];
		const offer: DraftOffer = { majorId: major.id, majorName: major.name, year: major.year, team };
		if (!used.includes(offerKey(offer))) return offer;
	}
}

export function createDraft(majors: Major[], mode: GameMode, seed: number): DraftState {
	const rng = new Rng(seed);
	const offer = rollOffer(majors, [], rng);
	return {
		seed,
		mode,
		round: 0,
		rerollsLeft: REROLLS[mode],
		usedTeamKeys: [offerKey(offer)],
		offer,
		picks: [],
		rngState: rng.state
	};
}

export function isComplete(state: DraftState): boolean {
	return state.picks.length === DRAFT_ORDER.length;
}

/**
 * Define a função que cada jogador exerce (`slot`) usando apenas suas funções
 * naturais (role/role2), resolvendo híbridos para minimizar conflitos de
 * composição. Funções repetidas são permitidas (ex.: dois lurkers).
 */
export function assignSlots(picks: DraftedPlayer[]): DraftedPlayer[] {
	if (picks.length === 0) return picks;
	const roles = resolveRoles(picks);
	return picks.map((p, i) => ({ ...p, slot: roles[i] }));
}

/**
 * Reatribui manualmente a função (`slot`) de um jogador — qualquer função das 5,
 * inclusive repetida e mesmo que gere penalidade. Usado na revisão (drag and drop);
 * a escolha manual NÃO é sobrescrita pela realocação automática.
 */
export function setSlot(picks: DraftedPlayer[], nick: string, role: Role): DraftedPlayer[] {
	return picks.map((p) => (p.nick === nick ? { ...p, slot: role } : p));
}

/**
 * Escala o jogador `nick` da oferta atual — qualquer função, inclusive
 * repetida — e avança. Os slots do elenco são realocados a cada pick.
 */
export function pick(state: DraftState, majors: Major[], nick: string): DraftState {
	if (!state.offer) throw new Error('Draft já está completo');
	const player = state.offer.team.players.find((p) => p.nick === nick);
	if (!player) throw new Error(`Jogador "${nick}" não está na oferta atual`);

	const drafted: DraftedPlayer = {
		...player,
		slot: player.role,
		teamName: state.offer.team.name,
		majorId: state.offer.majorId,
		majorName: state.offer.majorName
	};

	const picks = assignSlots([...state.picks, drafted]);
	const round = state.round + 1;
	if (round >= DRAFT_ORDER.length) {
		return { ...state, round, picks, offer: null };
	}

	const rng = new Rng(state.rngState);
	const offer = rollOffer(majors, state.usedTeamKeys, rng);
	return {
		...state,
		round,
		picks,
		offer,
		usedTeamKeys: [...state.usedTeamKeys, offerKey(offer)],
		rngState: rng.state
	};
}

/** Troca a oferta atual por outro time, gastando um re-sorteio. */
export function reroll(state: DraftState, majors: Major[]): DraftState {
	if (!state.offer) throw new Error('Draft já está completo');
	if (state.rerollsLeft <= 0) throw new Error('Sem re-sorteios restantes');

	const rng = new Rng(state.rngState);
	const offer = rollOffer(majors, state.usedTeamKeys, rng);
	return {
		...state,
		rerollsLeft: state.rerollsLeft - 1,
		offer,
		usedTeamKeys: [...state.usedTeamKeys, offerKey(offer)],
		rngState: rng.state
	};
}
