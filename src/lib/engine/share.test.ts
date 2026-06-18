import { describe, expect, test } from 'vitest';
import type { DraftedPlayer } from '$lib/data/types';
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
				overtime: false,
				rounds: []
			})),
			scoreA: 0,
			scoreB: 0,
			winner: 'A'
		}
	};
}

// Helpers de picks fictícios para os testes
function makePicks(nicks: string[]): DraftedPlayer[] {
	return nicks.map((nick, i) => ({
		nick,
		role: 'entry' as const,
		rating: 1.0,
		slot: 'entry' as const,
		teamName: 'Time Fictício',
		majorId: 'test-major',
		majorName: 'Test Major'
	}));
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
			mode: 'classic',
			picks: makePicks(['s1mple', 'NiKo', 'device', 'karrigan', 'KSCERATO'])
		});
		expect(text).toContain('🟩🟥🟩');
	});

	test('inclui o resultado, a seed e o modo', () => {
		const text = shareText({
			finish: 'campeão',
			matches: [match({ won: true, maps: [[13, 0]] })],
			seed: 99,
			mode: 'almanac',
			picks: makePicks(['s1mple', 'NiKo', 'device', 'karrigan', 'KSCERATO'])
		});
		expect(text).toContain('CAMPEÃO');
		expect(text).toContain('#99');
		expect(text.toLowerCase()).toContain('às cegas');
	});

	test('inclui os nicks dos jogadores separados por ·', () => {
		const text = shareText({
			finish: 'campeão',
			matches: [match({ won: true, maps: [[13, 7]] })],
			seed: 1,
			mode: 'classic',
			picks: makePicks(['s1mple', 'NiKo', 'device', 'karrigan', 'KSCERATO'])
		});
		expect(text).toContain('s1mple · NiKo · device · karrigan · KSCERATO');
	});

	test('inclui o link fixo jogar13a0.com.br', () => {
		const text = shareText({
			finish: 'quartas',
			matches: [match({ won: false, maps: [[5, 13]] })],
			seed: 7,
			mode: 'classic',
			picks: makePicks(['s1mple', 'NiKo', 'device', 'karrigan', 'KSCERATO'])
		});
		expect(text).toContain('jogar13a0.com.br');
	});

	test('NÃO inclui mapa perfeito 13 a 0 no share', () => {
		const text = shareText({
			finish: 'campeão',
			matches: [match({ won: true, maps: [[13, 0]] })],
			seed: 5,
			mode: 'classic',
			picks: makePicks(['s1mple', 'NiKo', 'device', 'karrigan', 'KSCERATO'])
		});
		expect(text).not.toContain('13 a 0');
		expect(text).not.toContain('perfeito');
		expect(text).not.toContain('💎');
	});

	test('inclui 🔥 Campanha invicta apenas quando campeão invicto', () => {
		const invicto = shareText({
			finish: 'campeão',
			matches: [
				match({ won: true, maps: [[13, 7]] }),
				match({ won: true, maps: [[13, 9]] })
			],
			seed: 2,
			mode: 'classic',
			picks: makePicks(['s1mple', 'NiKo', 'device', 'karrigan', 'KSCERATO'])
		});
		expect(invicto).toContain('🔥');

		const naoInvicto = shareText({
			finish: 'campeão',
			matches: [
				match({ won: true, maps: [[13, 7]] }),
				match({ won: false, maps: [[5, 13]] }),
				match({ won: true, maps: [[13, 9]] })
			],
			seed: 3,
			mode: 'classic',
			picks: makePicks(['s1mple', 'NiKo', 'device', 'karrigan', 'KSCERATO'])
		});
		expect(naoInvicto).not.toContain('🔥');
	});

	test('picks vazio não quebra o formato', () => {
		expect(() =>
			shareText({
				finish: 'fase suíça',
				matches: [match({ won: false, maps: [[5, 13]] })],
				seed: 0,
				mode: 'classic',
				picks: []
			})
		).not.toThrow();
	});
});
