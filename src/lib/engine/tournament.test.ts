import { describe, expect, test } from 'vitest';
import { Rng } from './rng';
import { simulatePlayoffs, simulateSwiss, simulateTournament } from './tournament';
import type { TournamentTeam } from './tournament';

function makeTeams(n: number): TournamentTeam[] {
	return Array.from({ length: n }, (_, i) => ({
		id: `t${i}`,
		name: `Time ${i}`,
		strength: 0.95 + (i % 8) * 0.04
	}));
}

describe('simulateSwiss', () => {
	test('16 times: 8 classificam com 3 vitórias e 8 caem com 3 derrotas', () => {
		for (const seed of [1, 2, 3, 42, 1000]) {
			const result = simulateSwiss(makeTeams(16), new Rng(seed));
			expect(result.qualified).toHaveLength(8);
			expect(result.eliminated).toHaveLength(8);
			for (const t of result.qualified) {
				expect(result.records[t.id].wins).toBe(3);
				expect(result.records[t.id].losses).toBeLessThan(3);
			}
			for (const t of result.eliminated) {
				expect(result.records[t.id].losses).toBe(3);
			}
		}
	});

	test('partidas de eliminação ou classificação são BO3, demais BO1', () => {
		const result = simulateSwiss(makeTeams(16), new Rng(5));
		for (const round of result.rounds) {
			for (const match of round.matches) {
				const decisive = match.recordBefore.wins === 2 || match.recordBefore.losses === 2;
				expect(match.bestOf).toBe(decisive ? 3 : 1);
			}
		}
	});

	test('é determinístico para a mesma seed', () => {
		const a = simulateSwiss(makeTeams(16), new Rng(77));
		const b = simulateSwiss(makeTeams(16), new Rng(77));
		expect(a.qualified.map((t) => t.id)).toEqual(b.qualified.map((t) => t.id));
	});
});

describe('simulatePlayoffs', () => {
	test('tem 4 quartas, 2 semis, 1 final e um campeão', () => {
		const result = simulatePlayoffs(makeTeams(8), new Rng(3));
		expect(result.quarterfinals).toHaveLength(4);
		expect(result.semifinals).toHaveLength(2);
		expect(result.final).toBeDefined();
		const finalists = [result.final.a.id, result.final.b.id];
		expect(finalists).toContain(result.champion.id);
	});
});

describe('simulateTournament', () => {
	test('retorna campanha completa do usuário', () => {
		const [user, ...rest] = makeTeams(16);
		user.isUser = true;
		const result = simulateTournament(user, rest, new Rng(10));
		expect(result.swiss.qualified.length).toBe(8);
		const record = result.swiss.records[user.id];
		expect(record.wins === 3 || record.losses === 3).toBe(true);
		if (record.wins === 3) {
			expect(result.playoffs).toBeDefined();
			expect(['quartas', 'semi', 'vice', 'campeão']).toContain(result.userFinish);
		} else {
			expect(result.userFinish).toBe('fase suíça');
		}
	});

	test('usuário muito forte geralmente é campeão', () => {
		let titles = 0;
		for (let seed = 0; seed < 30; seed++) {
			const [user, ...rest] = makeTeams(16);
			user.isUser = true;
			user.strength = 1.35;
			const result = simulateTournament(user, rest, new Rng(seed));
			if (result.userFinish === 'campeão') titles++;
		}
		expect(titles).toBeGreaterThan(20);
	});

	test('mapas do usuário ficam acessíveis para conquistas (13 a 0, invicto)', () => {
		const [user, ...rest] = makeTeams(16);
		user.isUser = true;
		const result = simulateTournament(user, rest, new Rng(8));
		expect(result.userMatches.length).toBeGreaterThanOrEqual(3);
		for (const m of result.userMatches) {
			expect(m.opponent).toBeDefined();
			expect(m.series.maps.length).toBeGreaterThan(0);
			expect(typeof m.userWon).toBe('boolean');
		}
	});
});
