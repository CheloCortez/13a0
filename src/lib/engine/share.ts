import type { GameMode } from './draft';
import type { UserFinish, UserMatch } from './tournament';

export interface Achievements {
	/** Venceu algum mapa por 13 a 0 — a conquista que dá nome ao jogo. */
	perfectMap: boolean;
	/** Campanha sem perder nenhuma série. */
	unbeaten: boolean;
}

export function computeAchievements(matches: UserMatch[]): Achievements {
	let perfectMap = false;
	for (const m of matches) {
		for (const map of m.series.maps) {
			const user = m.userIsA ? map.scoreA : map.scoreB;
			const opponent = m.userIsA ? map.scoreB : map.scoreA;
			if (user === 13 && opponent === 0) perfectMap = true;
		}
	}
	return { perfectMap, unbeaten: matches.length > 0 && matches.every((m) => m.userWon) };
}

const FINISH_LABELS: Record<UserFinish, string> = {
	'fase suíça': '❌ Eliminado na fase suíça',
	quartas: '🎖️ Quartas de final',
	semi: '🥉 Semifinal',
	vice: '🥈 VICE-CAMPEÃO',
	campeão: '🏆 CAMPEÃO DO MAJOR'
};

const MODE_LABELS: Record<GameMode, string> = { classic: 'Clássico', almanac: 'Almanaque' };

export function shareText(opts: {
	finish: UserFinish;
	matches: UserMatch[];
	seed: number;
	mode: GameMode;
}): string {
	const grid = opts.matches.map((m) => (m.userWon ? '🟩' : '🟥')).join('');
	const achievements = computeAchievements(opts.matches);

	const lines = [
		`13 A 0 — Major #${opts.seed} (modo ${MODE_LABELS[opts.mode]})`,
		FINISH_LABELS[opts.finish],
		grid
	];
	if (achievements.perfectMap) lines.push('💎 Mapa perfeito: 13 a 0!');
	if (achievements.unbeaten && opts.finish === 'campeão') lines.push('🔥 Campanha invicta!');

	return lines.join('\n');
}
