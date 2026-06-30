/** Funções clássicas de um time de CS. */
export type Role = 'awp' | 'igl' | 'entry' | 'lurker' | 'support';

export const ROLES: Role[] = ['awp', 'igl', 'entry', 'lurker', 'support'];

export const ROLE_LABELS: Record<Role, string> = {
	awp: 'AWPer',
	igl: 'IGL',
	entry: 'Entry',
	lurker: 'Lurker',
	support: 'Suporte'
};

export interface Player {
	nick: string;
	role: Role;
	/** Função secundária para jogadores híbridos (ex: FalleN é awp + igl). */
	role2?: Role;
	/** Escala estilo HLTV: ~0.80 (fraco) a ~1.45 (lendário), relativa ao desempenho na época do Major. */
	rating: number;
}

export interface Team {
	id: string;
	name: string;
	/** Colocação no Major real, ex: "Campeão", "3º-4º", "Fase de grupos". */
	placement: string;
	players: Player[];
}

export interface Major {
	id: string;
	name: string;
	year: number;
	city: string;
	teams: Team[];
}

export interface MajorIndexEntry {
	id: string;
	name: string;
	year: number;
	city: string;
	champion: string;
}

/** Jogador escalado no draft do usuário. */
export interface DraftedPlayer extends Player {
	/** Função em que foi escalado. null = não alocado (modo cego: usuário aloca na revisão). */
	slot: Role | null;
	/** ID do time de origem (chave dos logos: `${majorId}/${teamId}`). Ausente em saves antigos. */
	teamId?: string;
	teamName: string;
	majorId: string;
	majorName: string;
}

export const RATING_MIN = 0.8;
export const RATING_MAX = 1.45;
