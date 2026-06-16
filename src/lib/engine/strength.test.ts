import { describe, expect, test } from 'vitest';
import type { DraftedPlayer, Role, Team } from '$lib/data/types';
import {
	dynastyBonus,
	effectiveRating,
	historicTeamStrength,
	resolveRoles,
	teamModifiers,
	teamStrength
} from './strength';

function dp(
	partial: Partial<DraftedPlayer> & Pick<DraftedPlayer, 'nick' | 'role' | 'rating'>
): DraftedPlayer {
	return {
		slot: partial.role,
		teamName: `Time ${partial.nick}`,
		majorId: 'major-x',
		majorName: 'Major X',
		...partial
	};
}

// time equilibrado: uma função de cada, organizações distintas
const balanced: DraftedPlayer[] = [
	dp({ nick: 'awper', role: 'awp', rating: 1.2 }),
	dp({ nick: 'leader', role: 'igl', rating: 1.0 }),
	dp({ nick: 'rusher', role: 'entry', rating: 1.1 }),
	dp({ nick: 'sneaky', role: 'lurker', rating: 1.1 }),
	dp({ nick: 'helper', role: 'support', rating: 1.0 })
];
const AVG = (1.2 + 1.0 + 1.1 + 1.1 + 1.0) / 5; // 1.08

describe('effectiveRating', () => {
	test('é o próprio rating (sem penalidade de fora de função)', () => {
		expect(effectiveRating({ rating: 1.2 })).toBe(1.2);
	});
});

describe('resolveRoles', () => {
	test('jogadores puros ficam na função primária', () => {
		expect(resolveRoles([{ role: 'awp' }, { role: 'lurker' }, { role: 'lurker' }])).toEqual([
			'awp',
			'lurker',
			'lurker'
		]);
	});

	test('híbrido evita conflito jogando a 2ª função (FalleN awp/igl + device awp)', () => {
		expect(resolveRoles([{ role: 'awp', role2: 'igl' }, { role: 'awp' }])).toEqual(['igl', 'awp']);
	});

	test('sem conflito, o híbrido mantém a função primária', () => {
		expect(resolveRoles([{ role: 'awp', role2: 'igl' }, { role: 'entry' }])).toEqual([
			'awp',
			'entry'
		]);
	});
});

describe('teamStrength', () => {
	test('time equilibrado = média dos ratings (sem penalidade nem bônus)', () => {
		expect(teamStrength(balanced)).toBeCloseTo(AVG);
	});

	test('dois lurkers aplicam -4%', () => {
		const team = balanced.map((p) => (p.role === 'entry' ? dp({ nick: 'lk2', role: 'lurker', rating: 1.1 }) : p));
		expect(teamStrength(team)).toBeCloseTo(AVG * 0.96);
	});

	test('três lurkers acumulam (×0.96^2)', () => {
		const team = balanced.map((p) =>
			p.role === 'entry' || p.role === 'support'
				? dp({ nick: `lk-${p.role}`, role: 'lurker', rating: 1.0 })
				: p
		);
		const avg = (1.2 + 1.0 + 1.1 + 1.0 + 1.0) / 5;
		expect(teamStrength(team)).toBeCloseTo(avg * 0.96 ** 2);
	});

	test('dois AWPers puros aplicam -8%', () => {
		const team = balanced.map((p) => (p.role === 'entry' ? dp({ nick: 'awp2', role: 'awp', rating: 1.1 }) : p));
		expect(teamStrength(team)).toBeCloseTo(AVG * 0.92);
	});

	test('dois IGLs puros aplicam -8%', () => {
		const team = balanced.map((p) => (p.role === 'entry' ? dp({ nick: 'igl2', role: 'igl', rating: 1.1 }) : p));
		expect(teamStrength(team)).toBeCloseTo(AVG * 0.92);
	});

	test('AWPer híbrido escalado de IGL (slot=igl) NÃO penaliza, mesmo ao lado de um AWPer', () => {
		const team = balanced.map((p) =>
			p.role === 'igl' ? dp({ nick: 'FalleN', role: 'awp', role2: 'igl', rating: 1.0, slot: 'igl' }) : p
		);
		expect(teamStrength(team)).toBeCloseTo(AVG);
	});

	test('a penalidade segue o slot escalado, não a função natural', () => {
		// um entry de ofício escalado como 2º AWP gera o conflito de AWP (−8%)
		const team = balanced.map((p) =>
			p.role === 'entry' ? dp({ nick: 'forced', role: 'entry', rating: 1.1, slot: 'awp' }) : p
		);
		expect(teamStrength(team)).toBeCloseTo(AVG * 0.92);
	});

	test('três jogadores da mesma organização dão +4%', () => {
		const team: DraftedPlayer[] = [
			dp({ nick: 'a', role: 'awp', rating: 1.2, teamName: 'Astralis' }),
			dp({ nick: 'b', role: 'igl', rating: 1.0, teamName: 'Astralis' }),
			dp({ nick: 'c', role: 'entry', rating: 1.1, teamName: 'Astralis' }),
			dp({ nick: 'd', role: 'lurker', rating: 1.1 }),
			dp({ nick: 'e', role: 'support', rating: 1.0 })
		];
		expect(teamStrength(team)).toBeCloseTo(AVG * 1.04);
	});

	test('cinco AWPers puros acumulam a penalidade (×0.92^4)', () => {
		const team = ['a', 'b', 'c', 'd', 'e'].map((n) => dp({ nick: n, role: 'awp', rating: 1.0 }));
		expect(teamStrength(team)).toBeCloseTo(1.0 * 0.92 ** 4);
	});
});

describe('teamModifiers', () => {
	test('time equilibrado não tem modificadores', () => {
		expect(teamModifiers(balanced)).toEqual([]);
	});

	test('dois AWPers puros listam conflito de AWP', () => {
		const team = balanced.map((p) => (p.role === 'entry' ? dp({ nick: 'awp2', role: 'awp', rating: 1.1 }) : p));
		expect(teamModifiers(team)).toContainEqual({
			kind: 'awp-conflict',
			count: 2,
			pct: expect.closeTo(-8)
		});
	});

	test('dois lurkers listam conflito de função', () => {
		const team = balanced.map((p) => (p.role === 'entry' ? dp({ nick: 'lk2', role: 'lurker', rating: 1.0 }) : p));
		expect(teamModifiers(team)).toContainEqual({
			kind: 'frag-conflict',
			role: 'lurker' as Role,
			count: 2,
			pct: expect.closeTo(-4)
		});
	});

	test('três da mesma organização listam o bônus de sinergia', () => {
		const team = balanced.map((p, i) => (i < 3 ? dp({ ...p, teamName: 'Astralis' }) : p));
		expect(teamModifiers(team)).toContainEqual({
			kind: 'same-team',
			team: 'Astralis',
			count: 3,
			pct: expect.closeTo(4)
		});
	});
});

describe('dynastyBonus', () => {
	test('0 ou 1 título = sem bônus', () => {
		expect(dynastyBonus(0)).toBe(1.00);
		expect(dynastyBonus(1)).toBe(1.00);
	});
	test('2 títulos = +4%', () => expect(dynastyBonus(2)).toBe(1.04));
	test('3 títulos = +7%', () => expect(dynastyBonus(3)).toBe(1.07));
	test('4+ títulos = +10%', () => {
		expect(dynastyBonus(4)).toBe(1.10);
		expect(dynastyBonus(5)).toBe(1.10);
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
