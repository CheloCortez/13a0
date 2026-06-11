import type { Rng } from './rng';

export interface MapResult {
	scoreA: number;
	scoreB: number;
	winner: 'A' | 'B';
	overtime: boolean;
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
	let scoreA = 0;
	let scoreB = 0;

	while (scoreA < 13 && scoreB < 13 && !(scoreA === 12 && scoreB === 12)) {
		if (playRound(p, rng) === 'A') scoreA++;
		else scoreB++;
	}

	let overtime = false;
	if (scoreA === 12 && scoreB === 12) {
		overtime = true;
		// Blocos MR3: primeiro a 4 vitórias no bloco leva; 3-3 reinicia o bloco.
		for (;;) {
			let blockA = 0;
			let blockB = 0;
			while (blockA < 4 && blockB < 4 && !(blockA === 3 && blockB === 3)) {
				if (playRound(p, rng) === 'A') blockA++;
				else blockB++;
			}
			scoreA += blockA;
			scoreB += blockB;
			if (blockA !== blockB) break;
		}
	}

	return { scoreA, scoreB, winner: scoreA > scoreB ? 'A' : 'B', overtime };
}

/** Simula uma série BO1 ou BO3. */
export function simulateSeries(
	strengthA: number,
	strengthB: number,
	bestOf: 1 | 3,
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
