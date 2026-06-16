import { describe, expect, test } from 'vitest';
import type { DraftedPlayer, Major } from '$lib/data/types';
import { REROLLS, assignSlots, createDraft, isComplete, pick, reroll, setSlot } from './draft';

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
	test('começa no primeiro pick com uma oferta e re-sorteios do modo', () => {
		const classic = createDraft(majors, 'classic', 42);
		expect(classic.round).toBe(0);
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
	test('escala o jogador na função natural dele e avança', () => {
		let state = createDraft(majors, 'classic', 1);
		const nick = state.offer!.team.players[2].nick; // entry de ofício
		state = pick(state, majors, nick);
		expect(state.picks).toHaveLength(1);
		expect(state.picks[0].nick).toBe(nick);
		expect(state.picks[0].slot).toBe('entry');
		expect(state.round).toBe(1);
		expect(state.offer).not.toBeNull();
	});

	test('permite repetir função: cinco AWPers completam o draft, todos de AWP', () => {
		let state = createDraft(majors, 'classic', 2);
		for (let i = 0; i < 5; i++) {
			expect(isComplete(state)).toBe(false);
			state = pick(state, majors, state.offer!.team.players[0].nick);
		}
		expect(isComplete(state)).toBe(true);
		expect(state.offer).toBeNull();
		expect(state.picks.every((p) => p.role === 'awp')).toBe(true);
		// sem 2ª função, todos jogam de AWP (funções repetidas são permitidas)
		expect(state.picks.every((p) => p.slot === 'awp')).toBe(true);
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

describe('assignSlots', () => {
	function dp(
		nick: string,
		role: DraftedPlayer['role'],
		rating: number,
		role2?: DraftedPlayer['role']
	): DraftedPlayer {
		return {
			nick,
			role,
			role2,
			rating,
			slot: role,
			teamName: `Time ${nick}`,
			majorId: 'major-x',
			majorName: 'Major X'
		};
	}

	test('jogadores puros ficam na sua função natural', () => {
		const picks = assignSlots([
			dp('a', 'awp', 1.0),
			dp('b', 'igl', 1.0),
			dp('c', 'entry', 1.0),
			dp('d', 'lurker', 1.0),
			dp('e', 'support', 1.0)
		]);
		for (const p of picks) expect(p.slot).toBe(p.role);
	});

	test('funções repetidas são permitidas (dois lurkers continuam lurkers)', () => {
		const picks = assignSlots([dp('a', 'lurker', 1.1), dp('b', 'lurker', 1.0)]);
		expect(picks.every((p) => p.slot === 'lurker')).toBe(true);
	});

	test('híbrido cede a função primária pra evitar conflito (FalleN awp+igl)', () => {
		const picks = assignSlots([dp('FalleN', 'awp', 1.1, 'igl'), dp('device', 'awp', 1.2)]);
		expect(picks.find((p) => p.nick === 'device')!.slot).toBe('awp');
		expect(picks.find((p) => p.nick === 'FalleN')!.slot).toBe('igl');
	});

	describe('setSlot', () => {
		test('reatribui a função de um jogador para qualquer das 5, mesmo gerando repetição', () => {
			const picks = [dp('a', 'igl', 1.0), dp('b', 'lurker', 1.0)];
			const moved = setSlot(picks, 'a', 'lurker'); // IGL escalado de lurker
			expect(moved.find((p) => p.nick === 'a')!.slot).toBe('lurker');
			expect(moved.find((p) => p.nick === 'b')!.slot).toBe('lurker'); // intocado
			expect(moved.filter((p) => p.slot === 'lurker')).toHaveLength(2);
		});

		test('não altera os demais jogadores nem o array original', () => {
			const picks = [dp('a', 'awp', 1.0), dp('b', 'entry', 1.0)];
			const moved = setSlot(picks, 'b', 'support');
			expect(moved.find((p) => p.nick === 'a')!.slot).toBe('awp');
			expect(picks.find((p) => p.nick === 'b')!.slot).toBe('entry'); // imutável
		});
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
