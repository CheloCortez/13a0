import { describe, expect, test } from 'vitest';
import type { Major } from '$lib/data/types';
import { Rng } from './rng';
import { buildOpponents } from './opponents';

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
				{ nick: `a-${m}-${t}`, role: 'awp' as const, rating: 1.0 + t * 0.01 },
				{ nick: `b-${m}-${t}`, role: 'igl' as const, rating: 1.0 },
				{ nick: `c-${m}-${t}`, role: 'entry' as const, rating: 1.0 },
				{ nick: `d-${m}-${t}`, role: 'lurker' as const, rating: 1.0 },
				{ nick: `e-${m}-${t}`, role: 'support' as const, rating: 1.0 }
			]
		}))
	}));
}

describe('buildOpponents', () => {
	test('retorna 15 times históricos distintos com força e nome com o major', () => {
		const opponents = buildOpponents(makeMajors(4, 8), new Rng(42));
		expect(opponents).toHaveLength(15);
		expect(new Set(opponents.map((o) => o.id)).size).toBe(15);
		for (const o of opponents) {
			expect(o.strength).toBeGreaterThan(0.8);
			expect(o.name).toMatch(/\d{4}/);
		}
	});

	test('é determinístico para a mesma seed', () => {
		const majors = makeMajors(4, 8);
		const a = buildOpponents(majors, new Rng(7)).map((o) => o.id);
		const b = buildOpponents(majors, new Rng(7)).map((o) => o.id);
		expect(a).toEqual(b);
	});
});

/** Marca o primeiro time de cada major como "Campeão". */
function makeChampMajors(count: number, teamsPerMajor: number): Major[] {
	return makeMajors(count, teamsPerMajor).map((mj) => ({
		...mj,
		teams: mj.teams.map((t, i) => (i === 0 ? { ...t, placement: 'Campeão' } : t))
	}));
}

describe('buildOpponents — apenas campeões (modo difícil)', () => {
	const champMajors = makeChampMajors(20, 6);

	test('com championsOnly, os 15 adversários são todos campeões e distintos', () => {
		const opponents = buildOpponents(champMajors, new Rng(42), true);
		expect(opponents).toHaveLength(15);
		expect(new Set(opponents.map((o) => o.id)).size).toBe(15);
		// id é `${major.id}/${team.id}`; o campeão é sempre o time de índice 0 (team-m-0)
		for (const o of opponents) expect(o.id).toMatch(/\/team-\d+-0$/);
	});

	test('é determinístico para a mesma seed', () => {
		const a = buildOpponents(champMajors, new Rng(7), true).map((o) => o.id);
		const b = buildOpponents(champMajors, new Rng(7), true).map((o) => o.id);
		expect(a).toEqual(b);
	});

	test('sem o flag, comportamento inalterado (pode incluir não-campeões)', () => {
		const opponents = buildOpponents(champMajors, new Rng(42));
		const hasNonChampion = opponents.some((o) => !/\/team-\d+-0$/.test(o.id));
		expect(hasNonChampion).toBe(true);
	});
});
