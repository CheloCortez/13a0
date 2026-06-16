import { describe, expect, test } from 'vitest';
import { Rng } from './rng';
import { roundWinProb, simulateMap, simulateSeries } from './match';

describe('roundWinProb', () => {
	test('forças iguais dão 50%', () => {
		expect(roundWinProb(1.1, 1.1)).toBeCloseTo(0.5);
	});

	test('é monotônica na força', () => {
		expect(roundWinProb(1.2, 1.0)).toBeGreaterThan(roundWinProb(1.1, 1.0));
		expect(roundWinProb(1.2, 1.0)).toBeGreaterThan(0.5);
		expect(roundWinProb(1.0, 1.2)).toBeLessThan(0.5);
	});

	test('fica em (0, 1) mesmo em extremos', () => {
		expect(roundWinProb(1.35, 0.85)).toBeLessThan(1);
		expect(roundWinProb(0.85, 1.35)).toBeGreaterThan(0);
	});
});

describe('simulateMap', () => {
	test('placar é válido: vencedor com 13 no tempo normal ou vitória no overtime', () => {
		const rng = new Rng(123);
		for (let i = 0; i < 500; i++) {
			const r = simulateMap(1.1, 1.05, rng);
			const win = Math.max(r.scoreA, r.scoreB);
			const lose = Math.min(r.scoreA, r.scoreB);
			if (!r.overtime) {
				expect(win).toBe(13);
				expect(lose).toBeLessThanOrEqual(11);
			} else {
				expect(win).toBeGreaterThanOrEqual(16);
				expect(win - lose).toBeIn([1, 2, 3, 4]);
			}
			expect(r.winner).toBe(r.scoreA > r.scoreB ? 'A' : 'B');
		}
	});

	test('time muito mais forte vence a grande maioria dos mapas', () => {
		const rng = new Rng(7);
		let winsA = 0;
		for (let i = 0; i < 400; i++) {
			if (simulateMap(1.3, 0.9, rng).winner === 'A') winsA++;
		}
		expect(winsA / 400).toBeGreaterThan(0.85);
	});

	test('é determinístico para a mesma seed', () => {
		const a = simulateMap(1.1, 1.0, new Rng(55));
		const b = simulateMap(1.1, 1.0, new Rng(55));
		expect(a).toEqual(b);
	});

	test('a sequência de rounds bate com o placar final', () => {
		const rng = new Rng(321);
		for (let i = 0; i < 200; i++) {
			const r = simulateMap(1.1, 1.0, rng);
			expect(r.rounds).toHaveLength(r.scoreA + r.scoreB);
			expect(r.rounds.filter((w) => w === 'A')).toHaveLength(r.scoreA);
			expect(r.rounds.filter((w) => w === 'B')).toHaveLength(r.scoreB);
		}
	});
});

describe('simulateSeries', () => {
	test('BO1 tem exatamente 1 mapa', () => {
		const r = simulateSeries(1.1, 1.0, 1, new Rng(9));
		expect(r.maps).toHaveLength(1);
		expect(r.scoreA + r.scoreB).toBe(1);
	});

	test('BO3 termina 2-0 ou 2-1', () => {
		const rng = new Rng(11);
		for (let i = 0; i < 100; i++) {
			const r = simulateSeries(1.1, 1.05, 3, rng);
			expect(Math.max(r.scoreA, r.scoreB)).toBe(2);
			expect([2, 3]).toContain(r.maps.length);
			expect(r.winner).toBe(r.scoreA > r.scoreB ? 'A' : 'B');
		}
	});
});

expect.extend({
	toBeIn(received: unknown, list: unknown[]) {
		return {
			pass: list.includes(received),
			message: () => `esperava ${received} em [${list}]`
		};
	}
});

declare module 'vitest' {
	interface Assertion {
		toBeIn(list: unknown[]): void;
	}
}
