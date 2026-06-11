import { describe, expect, test } from 'vitest';
import type { DraftedPlayer, Team } from '$lib/data/types';
import { effectiveRating, historicTeamStrength, teamStrength } from './strength';

function drafted(partial: Partial<DraftedPlayer> & Pick<DraftedPlayer, 'nick' | 'role' | 'slot' | 'rating'>): DraftedPlayer {
	return { teamName: `Time ${partial.nick}`, majorId: 'major-x', majorName: 'Major X', ...partial };
}

const fullTeam: DraftedPlayer[] = [
	drafted({ nick: 'awper', role: 'awp', slot: 'awp', rating: 1.2 }),
	drafted({ nick: 'leader', role: 'igl', slot: 'igl', rating: 1.0 }),
	drafted({ nick: 'rusher', role: 'entry', slot: 'entry', rating: 1.1 }),
	drafted({ nick: 'sneaky', role: 'lurker', slot: 'lurker', rating: 1.1 }),
	drafted({ nick: 'helper', role: 'support', slot: 'support', rating: 1.0 })
];

describe('effectiveRating', () => {
	test('jogador na função natural usa rating cheio', () => {
		expect(effectiveRating(drafted({ nick: 'a', role: 'awp', slot: 'awp', rating: 1.2 }))).toBe(1.2);
	});

	test('jogador na função secundária usa rating cheio', () => {
		const p = drafted({ nick: 'a', role: 'awp', role2: 'igl', slot: 'igl', rating: 1.2 });
		expect(effectiveRating(p)).toBe(1.2);
	});

	test('jogador fora de função sofre penalidade de 15%', () => {
		const p = drafted({ nick: 'a', role: 'awp', slot: 'igl', rating: 1.2 });
		expect(effectiveRating(p)).toBeCloseTo(1.2 * 0.85);
	});
});

describe('teamStrength', () => {
	test('time completo nas funções naturais = média dos ratings', () => {
		const avg = (1.2 + 1.0 + 1.1 + 1.1 + 1.0) / 5;
		expect(teamStrength(fullTeam)).toBeCloseTo(avg);
	});

	test('sem AWPer natural no slot de awp aplica -8%', () => {
		const team = fullTeam.map((p) =>
			p.slot === 'awp' ? drafted({ nick: 'rifler', role: 'entry', slot: 'awp', rating: 1.2 }) : p
		);
		const base = (1.2 * 0.85 + 1.0 + 1.1 + 1.1 + 1.0) / 5;
		expect(teamStrength(team)).toBeCloseTo(base * 0.92);
	});

	test('sem IGL natural no slot de igl aplica -10%', () => {
		const team = fullTeam.map((p) =>
			p.slot === 'igl' ? drafted({ nick: 'rifler', role: 'entry', slot: 'igl', rating: 1.0 }) : p
		);
		const base = (1.2 + 1.0 * 0.85 + 1.1 + 1.1 + 1.0) / 5;
		expect(teamStrength(team)).toBeCloseTo(base * 0.9);
	});

	test('dois jogadores do mesmo time/major dão +3% de sinergia', () => {
		const team = fullTeam.map((p, i) =>
			i < 2 ? { ...p, teamName: 'Astralis', majorId: 'london-2018' } : p
		);
		const avg = (1.2 + 1.0 + 1.1 + 1.1 + 1.0) / 5;
		expect(teamStrength(team)).toBeCloseTo(avg * 1.03);
	});
});

describe('historicTeamStrength', () => {
	test('é a média dos ratings do elenco', () => {
		const team: Team = {
			id: 't',
			name: 'T',
			placement: '1º',
			players: [
				{ nick: 'a', role: 'awp', rating: 1.2 },
				{ nick: 'b', role: 'igl', rating: 1.0 },
				{ nick: 'c', role: 'entry', rating: 1.1 },
				{ nick: 'd', role: 'lurker', rating: 1.0 },
				{ nick: 'e', role: 'support', rating: 0.9 }
			]
		};
		expect(historicTeamStrength(team)).toBeCloseTo(1.04);
	});
});
