import { describe, expect, test } from 'vitest';
import type { UserMatch } from './tournament';
import { computeAchievements, shareText } from './share';

function match(opts: { won: boolean; maps: [number, number][]; userIsA?: boolean }): UserMatch {
	const userIsA = opts.userIsA ?? true;
	return {
		stage: 'Rodada 1',
		opponent: { id: 'op', name: 'Astralis 2018', strength: 1.1 },
		userWon: opts.won,
		userIsA,
		series: {
			maps: opts.maps.map(([u, o]) => ({
				scoreA: userIsA ? u : o,
				scoreB: userIsA ? o : u,
				winner: (userIsA ? u > o : o > u) ? ('A' as const) : ('B' as const),
				overtime: false
			})),
			scoreA: 0,
			scoreB: 0,
			winner: 'A'
		}
	};
}

describe('computeAchievements', () => {
	test('detecta mapa perfeito 13 a 0 do usuário', () => {
		const a = computeAchievements([match({ won: true, maps: [[13, 0]] })]);
		expect(a.perfectMap).toBe(true);
	});

	test('13 a 0 sofrido pelo usuário não conta', () => {
		const a = computeAchievements([match({ won: false, maps: [[0, 13]] })]);
		expect(a.perfectMap).toBe(false);
	});

	test('considera o lado correto quando o usuário é o time B', () => {
		const a = computeAchievements([match({ won: true, maps: [[13, 0]], userIsA: false })]);
		expect(a.perfectMap).toBe(true);
	});

	test('invicto exige vencer todas as partidas', () => {
		expect(
			computeAchievements([
				match({ won: true, maps: [[13, 7]] }),
				match({ won: true, maps: [[13, 11]] })
			]).unbeaten
		).toBe(true);
		expect(
			computeAchievements([
				match({ won: true, maps: [[13, 7]] }),
				match({ won: false, maps: [[5, 13]] })
			]).unbeaten
		).toBe(false);
	});
});

describe('shareText', () => {
	test('tem um emoji por partida (verde vitória, vermelho derrota)', () => {
		const text = shareText({
			finish: 'campeão',
			matches: [
				match({ won: true, maps: [[13, 7]] }),
				match({ won: false, maps: [[5, 13]] }),
				match({ won: true, maps: [[13, 2]] })
			],
			seed: 42,
			mode: 'classic'
		});
		expect(text).toContain('🟩🟥🟩');
	});

	test('inclui o resultado, a seed e a conquista de mapa perfeito', () => {
		const text = shareText({
			finish: 'campeão',
			matches: [match({ won: true, maps: [[13, 0]] })],
			seed: 99,
			mode: 'almanac'
		});
		expect(text).toContain('CAMPEÃO');
		expect(text).toContain('#99');
		expect(text).toContain('13 a 0');
		expect(text.toLowerCase()).toContain('almanaque');
	});
});
