export interface CsMap {
	id: string;
	name: string;
	image: string;
}

/** Acúmulo de vitórias e derrotas de um time num mapa específico ao longo do torneio. */
export interface MapRecord {
	mapId: string;
	wins: number;
	losses: number;
}

export const MAP_POOL: CsMap[] = [
	{ id: 'mirage',  name: 'Mirage',  image: '/maps/mirage.jpg'  },
	{ id: 'inferno', name: 'Inferno', image: '/maps/inferno.jpg' },
	{ id: 'ancient', name: 'Ancient', image: '/maps/ancient.jpg' },
	{ id: 'nuke',    name: 'Nuke',    image: '/maps/nuke.jpg'    },
	{ id: 'anubis',  name: 'Anubis',  image: '/maps/anubis.jpg'  },
	{ id: 'vertigo', name: 'Vertigo', image: '/maps/vertigo.jpg' },
	{ id: 'train',   name: 'Train',   image: '/maps/train.jpg'   }
];

export type VetoAction = 'ban' | 'pick';

export interface VetoStep {
	action: VetoAction;
	actor: 'user' | 'opponent';
}

export type VetoState = 'available' | 'banned' | 'picked' | 'decider';

export interface VetoEntry {
	map: CsMap;
	state: VetoState;
	actor: 'user' | 'opponent' | null;
}

/** Registro de uma ação do veto em ordem cronológica, para animação. */
export interface VetoActionRecord {
	mapId: string;
	state: Exclude<VetoState, 'available'>;
	actor: 'user' | 'opponent' | null;
}

export function vetoSequence(bestOf: 1 | 3 | 5): VetoStep[] {
	if (bestOf === 1) {
		return [
			{ action: 'ban', actor: 'user' },
			{ action: 'ban', actor: 'opponent' },
			{ action: 'ban', actor: 'user' },
			{ action: 'ban', actor: 'opponent' },
			{ action: 'ban', actor: 'user' },
			{ action: 'ban', actor: 'opponent' }
		];
	}
	if (bestOf === 3) {
		// ban ban pick pick ban ban → decider
		return [
			{ action: 'ban', actor: 'user' },
			{ action: 'ban', actor: 'opponent' },
			{ action: 'pick', actor: 'user' },
			{ action: 'pick', actor: 'opponent' },
			{ action: 'ban', actor: 'user' },
			{ action: 'ban', actor: 'opponent' }
		];
	}
	// BO5: ban ban pick pick pick pick → decider
	return [
		{ action: 'ban', actor: 'user' },
		{ action: 'ban', actor: 'opponent' },
		{ action: 'pick', actor: 'user' },
		{ action: 'pick', actor: 'opponent' },
		{ action: 'pick', actor: 'user' },
		{ action: 'pick', actor: 'opponent' }
	];
}

/** LCG determinístico para escolhas automáticas do veto. */
function lcgNext(state: number): number {
	return (Math.imul(state, 1664525) + 1013904223) >>> 0;
}

/**
 * Executa o veto completo automaticamente (sem input do usuário) e retorna:
 * - entries: estado final de cada mapa (na ordem do MAP_POOL)
 * - selected: mapas na ordem de jogo
 * - actions: ações em ordem cronológica (para animar o veto na sequência real, não na ordem do pool)
 */
export function autoResolveVeto(
	seed: number,
	bestOf: 1 | 3 | 5
): { entries: VetoEntry[]; selected: CsMap[]; actions: VetoActionRecord[] } {
	const steps = vetoSequence(bestOf);
	const remaining = MAP_POOL.map((m) => m.id);
	const entries: VetoEntry[] = MAP_POOL.map((m) => ({ map: m, state: 'available', actor: null }));
	const picked: string[] = [];
	const actions: VetoActionRecord[] = [];
	let rngState = seed >>> 0;

	const removeFrom = (arr: string[], id: string) => {
		const i = arr.indexOf(id);
		if (i >= 0) arr.splice(i, 1);
	};

	for (const step of steps) {
		rngState = lcgNext(rngState);
		const idx = rngState % remaining.length;
		const id = remaining[idx];
		const entry = entries.find((e) => e.map.id === id)!;
		if (step.action === 'ban') {
			entry.state = 'banned';
			entry.actor = step.actor;
			actions.push({ mapId: id, state: 'banned', actor: step.actor });
		} else {
			entry.state = 'picked';
			entry.actor = step.actor;
			picked.push(id);
			actions.push({ mapId: id, state: 'picked', actor: step.actor });
		}
		removeFrom(remaining, id);
	}

	// mapa restante é o decider
	if (remaining.length > 0) {
		const deciderId = remaining[0];
		const entry = entries.find((e) => e.map.id === deciderId)!;
		entry.state = 'decider';
		entry.actor = null;
		actions.push({ mapId: deciderId, state: 'decider', actor: null });
		const selected =
			bestOf === 1
				? [MAP_POOL.find((m) => m.id === deciderId)!]
				: [...picked.map((id) => MAP_POOL.find((m) => m.id === id)!), MAP_POOL.find((m) => m.id === deciderId)!];
		return { entries, selected, actions };
	}

	const selected = picked.map((id) => MAP_POOL.find((m) => m.id === id)!);
	return { entries, selected, actions };
}
