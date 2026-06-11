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
