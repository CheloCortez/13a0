import { base } from '$app/paths';
import type { Major, MajorIndexEntry } from './types';

let indexCache: MajorIndexEntry[] | null = null;
let majorsCache: Major[] | null = null;

/** Busca um JSON com algumas tentativas e backoff — resiliente a falhas de rede pontuais. */
async function fetchJson<T>(url: string, label: string, attempts = 3): Promise<T> {
	let lastError: unknown;
	for (let i = 0; i < attempts; i++) {
		try {
			const res = await fetch(url);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			return (await res.json()) as T;
		} catch (err) {
			lastError = err;
			if (i < attempts - 1) {
				// backoff: 200ms, 400ms…
				await new Promise((r) => setTimeout(r, 200 * 2 ** i));
			}
		}
	}
	throw new Error(`Falha ao carregar ${label}: ${String(lastError)}`);
}

export async function loadMajorsIndex(): Promise<MajorIndexEntry[]> {
	if (!indexCache) {
		indexCache = await fetchJson<MajorIndexEntry[]>(
			`${base}/data/majors/index.json`,
			'o índice de majors'
		);
	}
	return indexCache;
}

/** Carrega todos os majors (JSONs pequenos, cacheados pela CDN e em memória). */
export async function loadAllMajors(): Promise<Major[]> {
	if (!majorsCache) {
		const index = await loadMajorsIndex();
		majorsCache = await Promise.all(
			index.map((entry) =>
				fetchJson<Major>(`${base}/data/majors/${entry.id}.json`, `o major ${entry.id}`)
			)
		);
	}
	return majorsCache;
}
