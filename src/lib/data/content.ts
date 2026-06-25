import type { MajorIndexEntry } from './types';

/** Ordena os Majors por ano (estável em empates), sem mutar a entrada. */
export function sortMajorsByYear(
	index: MajorIndexEntry[],
	dir: 'asc' | 'desc' = 'asc'
): MajorIndexEntry[] {
	return index
		.map((m, i) => ({ m, i }))
		.sort((x, y) =>
			dir === 'asc' ? x.m.year - y.m.year || x.i - y.i : y.m.year - x.m.year || x.i - y.i
		)
		.map((w) => w.m);
}
