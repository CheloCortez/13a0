import { base } from '$app/paths';
import type { Major, MajorIndexEntry } from './types';

let indexCache: MajorIndexEntry[] | null = null;
let majorsCache: Major[] | null = null;

export async function loadMajorsIndex(): Promise<MajorIndexEntry[]> {
	if (!indexCache) {
		const res = await fetch(`${base}/data/majors/index.json`);
		if (!res.ok) throw new Error('Falha ao carregar o índice de majors');
		indexCache = (await res.json()) as MajorIndexEntry[];
	}
	return indexCache;
}

/** Carrega todos os majors (JSONs pequenos, cacheados pela CDN e em memória). */
export async function loadAllMajors(): Promise<Major[]> {
	if (!majorsCache) {
		const index = await loadMajorsIndex();
		majorsCache = await Promise.all(
			index.map(async (entry) => {
				const res = await fetch(`${base}/data/majors/${entry.id}.json`);
				if (!res.ok) throw new Error(`Falha ao carregar o major ${entry.id}`);
				return (await res.json()) as Major;
			})
		);
	}
	return majorsCache;
}
