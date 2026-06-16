import type { Rng } from './rng';

export interface MapResult {
	scoreA: number;
	scoreB: number;
	winner: 'A' | 'B';
	overtime: boolean;
	/** Sequência de quem venceu cada round, na ordem — alimenta o placar ao vivo. */
	rounds: ('A' | 'B')[];
}

export interface SeriesResult {
	maps: MapResult[];
	scoreA: number;
	scoreB: number;
	winner: 'A' | 'B';
}

const STEEPNESS = 3.5;
const ROUND_NOISE = 0.08;

/** Probabilidade de A vencer um round, via função logística da diferença de forças. */
export function roundWinProb(strengthA: number, strengthB: number): number {
	return 1 / (1 + Math.exp(-STEEPNESS * (strengthA - strengthB)));
}

function playRound(p: number, rng: Rng): 'A' | 'B' {
	const noise = (rng.next() - 0.5) * ROUND_NOISE;
	const chance = Math.min(0.97, Math.max(0.03, p + noise));
	return rng.next() < chance ? 'A' : 'B';
}

/** Simula um mapa MR12 (13 rounds vencem; 12-12 vai a overtime MR3). */
export function simulateMap(strengthA: number, strengthB: number, rng: Rng): MapResult {
	const p = roundWinProb(strengthA, strengthB);
	const rounds: ('A' | 'B')[] = [];
	let scoreA = 0;
	let scoreB = 0;
	const round = () => {
		const w = playRound(p, rng);
		rounds.push(w);
		if (w === 'A') scoreA++;
		else scoreB++;
	};

	while (scoreA < 13 && scoreB < 13 && !(scoreA === 12 && scoreB === 12)) round();

	let overtime = false;
	if (scoreA === 12 && scoreB === 12) {
		overtime = true;
		// Blocos MR3: primeiro a 4 vitórias no bloco leva; 3-3 reinicia o bloco.
		for (;;) {
			const before = { a: scoreA, b: scoreB };
			while (
				scoreA - before.a < 4 &&
				scoreB - before.b < 4 &&
				!(scoreA - before.a === 3 && scoreB - before.b === 3)
			)
				round();
			if (scoreA - before.a !== scoreB - before.b) break;
		}
	}

	return { scoreA, scoreB, winner: scoreA > scoreB ? 'A' : 'B', overtime, rounds };
}

/** Simula uma série BO1, BO3 ou BO5. */
export function simulateSeries(
	strengthA: number,
	strengthB: number,
	bestOf: 1 | 3 | 5,
	rng: Rng
): SeriesResult {
	const toWin = Math.ceil(bestOf / 2);
	const maps: MapResult[] = [];
	let scoreA = 0;
	let scoreB = 0;

	while (scoreA < toWin && scoreB < toWin) {
		const map = simulateMap(strengthA, strengthB, rng);
		maps.push(map);
		if (map.winner === 'A') scoreA++;
		else scoreB++;
	}

	return { maps, scoreA, scoreB, winner: scoreA > scoreB ? 'A' : 'B' };
}
