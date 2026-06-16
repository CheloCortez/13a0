import { describe, expect, test } from 'vitest';
import type { MapResult } from './match';
import type { RosterPlayer } from './tournament';
import { boxScoreSeed, generateBoxScore } from './boxscore';

const teamA: RosterPlayer[] = [
	{ nick: 'star', rating: 1.3 },
	{ nick: 'solid', rating: 1.1 },
	{ nick: 'mid', rating: 1.0 },
	{ nick: 'role', rating: 0.95 },
	{ nick: 'weak', rating: 0.85 }
];
const teamB: RosterPlayer[] = [
	{ nick: 'b1', rating: 1.2 },
	{ nick: 'b2', rating: 1.05 },
	{ nick: 'b3', rating: 1.0 },
	{ nick: 'b4', rating: 0.95 },
	{ nick: 'b5', rating: 0.9 }
];
const map = (scoreA: number, scoreB: number): MapResult => ({
	scoreA,
	scoreB,
	winner: scoreA > scoreB ? 'A' : 'B',
	overtime: false,
	rounds: []
});

describe('generateBoxScore', () => {
	test('é determinístico para a mesma seed', () => {
		const a = generateBoxScore(teamA, teamB, map(13, 9), 42);
		const b = generateBoxScore(teamA, teamB, map(13, 9), 42);
		expect(a).toEqual(b);
	});

	test('cada time tem 5 jogadores com os nicks certos', () => {
		const bs = generateBoxScore(teamA, teamB, map(13, 7), 1);
		expect(bs.a.map((l) => l.nick)).toEqual(teamA.map((p) => p.nick));
		expect(bs.b.map((l) => l.nick)).toEqual(teamB.map((p) => p.nick));
	});

	test('mortes de um time = kills do outro (consistência com o placar)', () => {
		const bs = generateBoxScore(teamA, teamB, map(13, 10), 7);
		const killsA = bs.a.reduce((s, l) => s + l.kills, 0);
		const killsB = bs.b.reduce((s, l) => s + l.kills, 0);
		const deathsA = bs.a.reduce((s, l) => s + l.deaths, 0);
		const deathsB = bs.b.reduce((s, l) => s + l.deaths, 0);
		expect(deathsA).toBe(killsB);
		expect(deathsB).toBe(killsA);
	});

	test('total de kills é proporcional aos rounds e o vencedor fraga mais', () => {
		const bs = generateBoxScore(teamA, teamB, map(13, 5), 3);
		const total = [...bs.a, ...bs.b].reduce((s, l) => s + l.kills, 0);
		const R = 18;
		expect(total).toBeGreaterThan(R * 4);
		expect(total).toBeLessThan(R * 9);
		const killsA = bs.a.reduce((s, l) => s + l.kills, 0);
		const killsB = bs.b.reduce((s, l) => s + l.kills, 0);
		expect(killsA).toBeGreaterThan(killsB); // vencedor (13-5)
	});

	test('nenhum jogador morre mais que o número de rounds', () => {
		const m = map(13, 11);
		const bs = generateBoxScore(teamA, teamB, m, 99);
		for (const l of [...bs.a, ...bs.b]) expect(l.deaths).toBeLessThanOrEqual(24);
	});

	test('stats ficam em faixas realistas', () => {
		for (let s = 1; s <= 30; s++) {
			const bs = generateBoxScore(teamA, teamB, map(13, 6 + (s % 6)), s);
			for (const l of [...bs.a, ...bs.b]) {
				expect(l.adr).toBeGreaterThanOrEqual(40);
				expect(l.adr).toBeLessThanOrEqual(135);
				expect(l.kast).toBeGreaterThanOrEqual(42);
				expect(l.kast).toBeLessThanOrEqual(87);
				expect(l.rating3).toBeGreaterThanOrEqual(0.2);
				expect(l.rating3).toBeLessThanOrEqual(2.3);
			}
		}
	});

	test('em média, jogador de rating maior tem Rating 3.0 maior', () => {
		let starSum = 0;
		let weakSum = 0;
		const N = 200;
		for (let s = 1; s <= N; s++) {
			const bs = generateBoxScore(teamA, teamB, map(13, 9), s);
			starSum += bs.a[0].rating3; // star 1.3
			weakSum += bs.a[4].rating3; // weak 0.85
		}
		expect(starSum / N).toBeGreaterThan(weakSum / N + 0.2);
	});
});

describe('boxScoreSeed', () => {
	test('é estável e varia por mapa/etapa', () => {
		expect(boxScoreSeed(2026, 'Rodada 1', 0)).toBe(boxScoreSeed(2026, 'Rodada 1', 0));
		expect(boxScoreSeed(2026, 'Rodada 1', 0)).not.toBe(boxScoreSeed(2026, 'Rodada 1', 1));
		expect(boxScoreSeed(2026, 'Rodada 1', 0)).not.toBe(boxScoreSeed(2026, 'Quartas de final', 0));
	});
});
