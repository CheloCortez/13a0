import { describe, expect, test } from 'vitest';
import type { DraftedPlayer, Major } from './types';
import { resolveTeamId, badgeTeamId, majorYear } from './teamBadge';

const majors: Major[] = [
	{
		id: 'austin-2025',
		name: 'BLAST.tv Austin Major 2025',
		year: 2025,
		city: 'Austin',
		teams: [
			{ id: 'vitality', name: 'Team Vitality', placement: 'Campeão', players: [] },
			{ id: 'mongolz', name: 'The MongolZ', placement: 'Vice', players: [] }
		]
	}
];

function makePick(p: Partial<DraftedPlayer>): DraftedPlayer {
	return {
		nick: 'ZywOo',
		role: 'awp',
		rating: 1.45,
		slot: 'awp',
		teamName: 'Team Vitality',
		majorId: 'austin-2025',
		majorName: 'BLAST.tv Austin Major 2025',
		...p
	};
}

describe('resolveTeamId', () => {
	test('encontra o id pelo nome do time dentro do major', () => {
		expect(resolveTeamId(majors, 'austin-2025', 'Team Vitality')).toBe('vitality');
		expect(resolveTeamId(majors, 'austin-2025', 'The MongolZ')).toBe('mongolz');
	});

	test('retorna undefined para major ou time desconhecido', () => {
		expect(resolveTeamId(majors, 'inexistente', 'Team Vitality')).toBeUndefined();
		expect(resolveTeamId(majors, 'austin-2025', 'Time Fantasma')).toBeUndefined();
	});
});

describe('badgeTeamId', () => {
	test('usa o teamId persistido quando presente', () => {
		const pick = makePick({ teamId: 'vitality' });
		expect(badgeTeamId(majors, pick)).toBe('vitality');
	});

	test('cai no fallback por nome quando o save é antigo (sem teamId)', () => {
		const pick = makePick({ teamId: undefined });
		expect(badgeTeamId(majors, pick)).toBe('vitality');
	});
});

describe('majorYear', () => {
	test('retorna o ano do major', () => {
		expect(majorYear(majors, 'austin-2025')).toBe(2025);
	});

	test('retorna undefined para major desconhecido', () => {
		expect(majorYear(majors, 'inexistente')).toBeUndefined();
	});
});
