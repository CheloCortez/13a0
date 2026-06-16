import type { DraftedPlayer, Role, Team } from '$lib/data/types';

// Penalidades de composição (multiplicam a força do time):
const AWP_CONFLICT = 0.92; // por AWPer de ofício além do 1º
const IGL_CONFLICT = 0.92; // por IGL de ofício além do 1º
const FRAG_CONFLICT = 0.96; // por entry/lurker/support além do 2º
// Bônus: jogadores da mesma organização na vida real (3+):
const SAME_TEAM_BONUS = 1.04; // por jogador além do 2º na maior dupla/trio/etc.

const FRAG_ROLES: Role[] = ['entry', 'lurker', 'support'];

/** Rating do jogador (não há mais penalidade de "fora de função"). */
export function effectiveRating(p: { rating: number }): number {
	return p.rating;
}

type RoleCounts = Record<Role, number>;
const tally = (roles: Role[]): RoleCounts => {
	const c: RoleCounts = { awp: 0, igl: 0, entry: 0, lurker: 0, support: 0 };
	for (const r of roles) c[r]++;
	return c;
};

/**
 * Atribui a cada jogador uma de suas funções naturais (role ou role2),
 * escolhendo a combinação que minimiza as penalidades de conflito. Assim um
 * híbrido como FalleN (awp/igl) joga de IGL quando já há um AWPer, sem punição.
 * Empate prefere mais jogadores na função primária (estável/determinístico).
 */
export function resolveRoles(players: { role: Role; role2?: Role }[]): Role[] {
	const options = players.map((p) => (p.role2 ? [p.role, p.role2] : [p.role]));
	let best: Role[] = players.map((p) => p.role);
	let bestScore = -Infinity;
	let bestPrimary = -1;
	const cur: Role[] = [];

	const rec = (i: number) => {
		if (i === players.length) {
			const score = penaltyFactor(tally(cur));
			const primary = cur.reduce((n, r, idx) => n + (r === players[idx].role ? 1 : 0), 0);
			if (score > bestScore + 1e-9 || (Math.abs(score - bestScore) <= 1e-9 && primary > bestPrimary)) {
				bestScore = score;
				bestPrimary = primary;
				best = [...cur];
			}
			return;
		}
		for (const r of options[i]) {
			cur.push(r);
			rec(i + 1);
			cur.pop();
		}
	};
	rec(0);
	return best;
}

/** Fator multiplicativo das penalidades de conflito de funções. */
function penaltyFactor(c: RoleCounts): number {
	let f = 1;
	f *= AWP_CONFLICT ** Math.max(0, c.awp - 1);
	f *= IGL_CONFLICT ** Math.max(0, c.igl - 1);
	for (const r of FRAG_ROLES) f *= FRAG_CONFLICT ** Math.max(0, c[r] - 1);
	return f;
}

/** Maior grupo de jogadores da mesma organização; bônus a partir de 3. */
function topSquad(players: { teamName: string }[]): { team: string; count: number } | null {
	const groups = new Map<string, number>();
	for (const p of players) groups.set(p.teamName, (groups.get(p.teamName) ?? 0) + 1);
	let team = '';
	let count = 0;
	for (const [t, n] of groups) if (n > count) ((count = n), (team = t));
	return count >= 3 ? { team, count } : null;
}

/**
 * Força do time draftado: média dos ratings, com penalidades de conflito de
 * função (2+ AWPers/IGLs de ofício; 3+ entry/lurker/support) e bônus de
 * organização (3+ jogadores do mesmo time na vida real).
 */
export function teamStrength(players: DraftedPlayer[]): number {
	let strength = players.reduce((sum, p) => sum + p.rating, 0) / players.length;
	// As penalidades seguem a função em que cada jogador foi ESCALADO (slot), não a
	// resolução automática — assim a escolha manual do usuário afeta a força.
	strength *= penaltyFactor(tally(players.map((p) => p.slot)));
	const squad = topSquad(players);
	if (squad) strength *= SAME_TEAM_BONUS ** (squad.count - 2);
	return strength;
}

/** Modificador ativo na força do time, para exibição na UI. */
export type TeamModifier =
	| { kind: 'awp-conflict'; count: number; pct: number }
	| { kind: 'igl-conflict'; count: number; pct: number }
	| { kind: 'frag-conflict'; role: Role; count: number; pct: number }
	| { kind: 'same-team'; team: string; count: number; pct: number };

const pctOf = (factor: number) => (factor - 1) * 100;

/** Lista os modificadores ativos no elenco (penalidades de conflito + bônus). */
export function teamModifiers(players: DraftedPlayer[]): TeamModifier[] {
	const mods: TeamModifier[] = [];
	const c = tally(players.map((p) => p.slot));

	if (c.awp >= 2) mods.push({ kind: 'awp-conflict', count: c.awp, pct: pctOf(AWP_CONFLICT ** (c.awp - 1)) });
	if (c.igl >= 2) mods.push({ kind: 'igl-conflict', count: c.igl, pct: pctOf(IGL_CONFLICT ** (c.igl - 1)) });
	for (const r of FRAG_ROLES) {
		if (c[r] >= 2) mods.push({ kind: 'frag-conflict', role: r, count: c[r], pct: pctOf(FRAG_CONFLICT ** (c[r] - 1)) });
	}
	const squad = topSquad(players);
	if (squad) {
		mods.push({ kind: 'same-team', team: squad.team, count: squad.count, pct: pctOf(SAME_TEAM_BONUS ** (squad.count - 2)) });
	}
	return mods;
}

/** Força de um time histórico adversário: média simples dos ratings. */
export function historicTeamStrength(team: Team): number {
	return team.players.reduce((sum, p) => sum + p.rating, 0) / team.players.length;
}

/** Multiplicador de dinastia: organizações com mais títulos de Major são mais fortes. */
export function dynastyBonus(champCount: number): number {
	if (champCount >= 4) return 1.10;
	if (champCount === 3) return 1.07;
	if (champCount === 2) return 1.04;
	return 1.00;
}
