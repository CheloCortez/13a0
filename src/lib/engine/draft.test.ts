import { describe, expect, test } from 'vitest';
import type { Major } from '$lib/data/types';
import { DRAFT_ORDER, REROLLS, createDraft, isComplete, pick, reroll } from './draft';

function makeMajors(count: number, teamsPerMajor: number): Major[] {
	return Array.from({ length: count }, (_, m) => ({
		id: `major-${m}`,
		name: `Major ${m}`,
		year: 2013 + m,
		city: 'Cidade',
		teams: Array.from({ length: teamsPerMajor }, (_, t) => ({
			id: `team-${m}-${t}`,
			name: `Time ${m}-${t}`,
			placement: '1º',
			players: [
				{ nick: `awp-${m}-${t}`, role: 'awp' as const, rating: 1.1 },
				{ nick: `igl-${m}-${t}`, role: 'igl' as const, rating: 1.0 },
				{ nick: `entry-${m}-${t}`, role: 'entry' as const, rating: 1.05 },
				{ nick: `lurker-${m}-${t}`, role: 'lurker' as const, rating: 1.0 },
				{ nick: `support-${m}-${t}`, role: 'support' as const, rating: 0.95 }
			]
		}))
	}));
}

const majors = makeMajors(4, 6);

describe('createDraft', () => {
	test('começa na rodada do AWP com uma oferta e re-sorteios do modo', () => {
		const classic = createDraft(majors, 'classic', 42);
		expect(DRAFT_ORDER[classic.round]).toBe('awp');
		expect(classic.offer).not.toBeNull();
		expect(classic.rerollsLeft).toBe(REROLLS.classic);
		expect(createDraft(majors, 'almanac', 42).rerollsLeft).toBe(REROLLS.almanac);
	});

	test('é determinístico para a mesma seed', () => {
		const a = createDraft(majors, 'classic', 7);
		const b = createDraft(majors, 'classic', 7);
		expect(a.offer?.team.id).toBe(b.offer?.team.id);
	});
});

describe('pick', () => {
	test('escala o jogador no slot da rodada e avança', () => {
		let state = createDraft(majors, 'classic', 1);
		const nick = state.offer!.team.players[2].nick;
		state = pick(state, majors, nick);
		expect(state.picks).toHaveLength(1);
		expect(state.picks[0].nick).toBe(nick);
		expect(state.picks[0].slot).toBe('awp');
		expect(state.round).toBe(1);
		expect(state.offer).not.toBeNull();
	});

	test('cinco picks completam o draft na ordem das funções', () => {
		let state = createDraft(majors, 'classic', 2);
		for (let i = 0; i < 5; i++) {
			expect(isComplete(state)).toBe(false);
			state = pick(state, majors, state.offer!.team.players[0].nick);
		}
		expect(isComplete(state)).toBe(true);
		expect(state.offer).toBeNull();
		expect(state.picks.map((p) => p.slot)).toEqual(DRAFT_ORDER);
	});

	test('nunca oferece o mesmo time do mesmo major duas vezes na campanha', () => {
		let state = createDraft(majors, 'classic', 3);
		const seen = new Set<string>([`${state.offer!.majorId}/${state.offer!.team.id}`]);
		for (let i = 0; i < 2; i++) {
			state = reroll(state, majors);
			const key = `${state.offer!.majorId}/${state.offer!.team.id}`;
			expect(seen.has(key)).toBe(false);
			seen.add(key);
		}
		while (!isComplete(state)) {
			state = pick(state, majors, state.offer!.team.players[0].nick);
			if (state.offer) {
				const key = `${state.offer.majorId}/${state.offer.team.id}`;
				expect(seen.has(key)).toBe(false);
				seen.add(key);
			}
		}
	});
});

describe('reroll', () => {
	test('decrementa o contador e troca a oferta', () => {
		const state = createDraft(majors, 'classic', 4);
		const before = `${state.offer!.majorId}/${state.offer!.team.id}`;
		const after = reroll(state, majors);
		expect(after.rerollsLeft).toBe(state.rerollsLeft - 1);
		expect(`${after.offer!.majorId}/${after.offer!.team.id}`).not.toBe(before);
	});

	test('lança erro sem re-sorteios restantes', () => {
		let state = createDraft(majors, 'almanac', 5);
		state = reroll(state, majors);
		expect(() => reroll(state, majors)).toThrow();
	});
});
