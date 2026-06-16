import type { MapResult } from './match';
import { Rng } from './rng';
import type { RosterPlayer } from './tournament';

/** Linha de scoreboard de um jogador (estilo HLTV) para um mapa. */
export interface PlayerLine {
	nick: string;
	kills: number;
	deaths: number;
	/** Average Damage per Round. */
	adr: number;
	/** % de rounds com kill/assist/survive/trade. */
	kast: number;
	/** Impacto relativo (%), pode ser negativo. */
	swing: number;
	/** Rating 3.0 (estilo HLTV) — a métrica principal. */
	rating3: number;
}

export interface BoxScore {
	a: PlayerLine[];
	b: PlayerLine[];
}

const KILLS_PER_ROUND = 6.4; // total dos dois times por round
const FORM_SD = 0.16; // variância do desempenho por mapa
const OUTCOME_BIAS = 0.06; // vencedores tendem a render um pouco mais

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const round1 = (x: number) => Math.round(x * 10) / 10;
const round2 = (x: number) => Math.round(x * 100) / 100;

/** Amostra gaussiana (Box-Muller) determinística a partir do RNG. */
function gauss(rng: Rng): number {
	const u1 = Math.max(1e-9, rng.next());
	const u2 = rng.next();
	return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/** Distribui um total inteiro entre pesos (método do maior resto). */
function allocate(total: number, weights: number[]): number[] {
	const sum = weights.reduce((s, w) => s + w, 0) || 1;
	const raw = weights.map((w) => (total * w) / sum);
	const out = raw.map((r) => Math.floor(r));
	let rest = total - out.reduce((s, n) => s + n, 0);
	const order = raw
		.map((r, i) => ({ i, frac: r - Math.floor(r) }))
		.sort((x, y) => y.frac - x.frac);
	for (let k = 0; rest > 0; k++, rest--) out[order[k % order.length].i]++;
	return out;
}

/** Respeita o teto de mortes por jogador (1 por round), redistribuindo o excesso. */
function capDeaths(deaths: number[], maxPer: number): number[] {
	const out = [...deaths];
	for (;;) {
		const over = out.findIndex((d) => d > maxPer);
		if (over === -1) break;
		let excess = out[over] - maxPer;
		out[over] = maxPer;
		// redistribui para quem tem folga
		const room = out.map((d, i) => ({ i, room: maxPer - d })).filter((x) => x.room > 0 && x.i !== over);
		if (!room.length) break;
		for (const r of room) {
			if (excess <= 0) break;
			const give = Math.min(r.room, excess);
			out[r.i] += give;
			excess -= give;
		}
		if (excess > 0) break; // sem folga suficiente (não deve ocorrer com 5 jogadores)
	}
	return out;
}

/**
 * Gera o box score de um mapa a partir dos elencos (nick + rating) e do
 * resultado. Determinístico pela `seed`. As stats correlacionam com o rating
 * do jogador (com variância) e são consistentes com o placar: total de kills
 * ~ rounds, mortes de um time = kills do outro, vencedor fraga um pouco mais.
 */
export function generateBoxScore(
	teamA: RosterPlayer[],
	teamB: RosterPlayer[],
	map: MapResult,
	seed: number
): BoxScore {
	const rng = new Rng(seed >>> 0);
	const R = Math.max(1, map.scoreA + map.scoreB);

	// "form" do mapa por jogador: rating + ruído + viés de resultado.
	const formOf = (players: RosterPlayer[], won: boolean) =>
		players.map((p) => clamp(p.rating + gauss(rng) * FORM_SD + (won ? OUTCOME_BIAS : -OUTCOME_BIAS), 0.4, 2.1));
	const formA = formOf(teamA, map.winner === 'A');
	const formB = formOf(teamB, map.winner === 'B');

	// total de kills e divisão entre os times (vencedor leva fatia maior).
	const T = Math.round(R * KILLS_PER_ROUND);
	const shareA = clamp(0.5 + 0.18 * ((map.scoreA - map.scoreB) / R), 0.34, 0.66);
	const killsTeamA = Math.round(T * shareA);
	const killsTeamB = T - killsTeamA;

	const killsA = allocate(killsTeamA, formA.map((f) => f ** 1.6));
	const killsB = allocate(killsTeamB, formB.map((f) => f ** 1.6));
	// mortes de um time = kills do outro; quem rende mais morre menos.
	const deathsA = capDeaths(allocate(killsTeamB, formA.map((f) => (2.3 - f) ** 1.2)), R);
	const deathsB = capDeaths(allocate(killsTeamA, formB.map((f) => (2.3 - f) ** 1.2)), R);

	const lineOf = (
		players: RosterPlayer[],
		form: number[],
		kills: number[],
		deaths: number[]
	): PlayerLine[] => {
		const avgForm = form.reduce((s, f) => s + f, 0) / form.length;
		return players.map((p, i) => {
			const kpr = kills[i] / R;
			const dpr = deaths[i] / R;
			const adr = clamp(70 * form[i] + (kpr - 0.7) * 28 + gauss(rng) * 4, 40, 135);
			const kast = clamp(55 + (form[i] - 0.85) * 16 + (kpr - 0.7) * 10 + gauss(rng) * 3, 42, 87);
			const swing = (form[i] - avgForm) * 4.2 + gauss(rng) * 0.8;
			// Rating 3.0 derivado dos próprios stats (estilo HLTV 2.0): premia
			// kills/round, ADR e KAST e pune mortes/round. ~1.0 é a média.
			const rating3 = clamp(
				0.0073 * kast + 0.8643 * kpr - 0.5329 * dpr + 0.0032 * adr + 0.023,
				0.2,
				2.3
			);
			return {
				nick: p.nick,
				kills: kills[i],
				deaths: deaths[i],
				adr: round1(adr),
				kast: round1(kast),
				swing: round2(swing),
				rating3: round2(rating3)
			};
		});
	};

	return {
		a: lineOf(teamA, formA, killsA, deathsA),
		b: lineOf(teamB, formB, killsB, deathsB)
	};
}

/** Seed determinística para um mapa a partir da seed do torneio + identificadores. */
export function boxScoreSeed(tournamentSeed: number, stage: string, mapIndex: number): number {
	let h = (tournamentSeed ^ 0x9e3779b9) >>> 0;
	for (const c of stage) h = (Math.imul(h ^ c.charCodeAt(0), 0x01000193) >>> 0);
	h = (Math.imul(h ^ (mapIndex + 1), 0x01000193) >>> 0);
	return h >>> 0;
}
