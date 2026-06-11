import { simulateSeries, type SeriesResult } from './match';
import type { Rng } from './rng';

export interface TournamentTeam {
	id: string;
	name: string;
	strength: number;
	isUser?: boolean;
}

export interface TeamRecord {
	wins: number;
	losses: number;
}

export interface SwissMatch {
	a: TournamentTeam;
	b: TournamentTeam;
	/** Registro (igual para os dois lados) antes da partida — define BO1 vs BO3. */
	recordBefore: TeamRecord;
	bestOf: 1 | 3;
	series: SeriesResult;
}

export interface SwissRound {
	number: number;
	matches: SwissMatch[];
}

export interface SwissResult {
	rounds: SwissRound[];
	qualified: TournamentTeam[];
	eliminated: TournamentTeam[];
	records: Record<string, TeamRecord>;
}

export interface BracketMatch {
	a: TournamentTeam;
	b: TournamentTeam;
	series: SeriesResult;
}

export interface PlayoffsResult {
	quarterfinals: BracketMatch[];
	semifinals: BracketMatch[];
	final: BracketMatch;
	champion: TournamentTeam;
}

export type UserFinish = 'fase suíça' | 'quartas' | 'semi' | 'vice' | 'campeão';

export interface UserMatch {
	stage: string;
	opponent: TournamentTeam;
	series: SeriesResult;
	/** Mapas com o placar do usuário sempre como primeiro (A). */
	userWon: boolean;
	userIsA: boolean;
}

export interface TournamentResult {
	swiss: SwissResult;
	playoffs?: PlayoffsResult;
	userFinish: UserFinish;
	userMatches: UserMatch[];
}

function shuffle<T>(items: T[], rng: Rng): T[] {
	const arr = [...items];
	for (let i = arr.length - 1; i > 0; i--) {
		const j = rng.int(i + 1);
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

function winnerOf(match: { a: TournamentTeam; b: TournamentTeam; series: SeriesResult }): TournamentTeam {
	return match.series.winner === 'A' ? match.a : match.b;
}

function loserOf(match: { a: TournamentTeam; b: TournamentTeam; series: SeriesResult }): TournamentTeam {
	return match.series.winner === 'A' ? match.b : match.a;
}

/** Fase suíça de 16 times: 3 vitórias classificam, 3 derrotas eliminam. */
export function simulateSwiss(teams: TournamentTeam[], rng: Rng): SwissResult {
	const records: Record<string, TeamRecord> = {};
	for (const t of teams) records[t.id] = { wins: 0, losses: 0 };

	const rounds: SwissRound[] = [];
	const qualified: TournamentTeam[] = [];
	const eliminated: TournamentTeam[] = [];
	let active = [...teams];

	for (let roundNumber = 1; active.length > 0; roundNumber++) {
		const matches: SwissMatch[] = [];

		// Agrupa por registro (todos do mesmo grupo têm o mesmo W-L na suíça de 16).
		const buckets = new Map<string, TournamentTeam[]>();
		for (const t of active) {
			const r = records[t.id];
			const key = `${r.wins}-${r.losses}`;
			buckets.set(key, [...(buckets.get(key) ?? []), t]);
		}

		for (const bucket of buckets.values()) {
			const order = shuffle(bucket, rng);
			for (let i = 0; i < order.length; i += 2) {
				const a = order[i];
				const b = order[i + 1];
				const recordBefore = { ...records[a.id] };
				const decisive = recordBefore.wins === 2 || recordBefore.losses === 2;
				const bestOf: 1 | 3 = decisive ? 3 : 1;
				const series = simulateSeries(a.strength, b.strength, bestOf, rng);
				matches.push({ a, b, recordBefore, bestOf, series });

				const winner = series.winner === 'A' ? a : b;
				const loser = series.winner === 'A' ? b : a;
				records[winner.id].wins++;
				records[loser.id].losses++;
			}
		}

		rounds.push({ number: roundNumber, matches });

		const next: TournamentTeam[] = [];
		for (const t of active) {
			const r = records[t.id];
			if (r.wins === 3) qualified.push(t);
			else if (r.losses === 3) eliminated.push(t);
			else next.push(t);
		}
		active = next;
	}

	return { rounds, qualified, eliminated, records };
}

/** Playoffs de 8 times: quartas, semis e final, tudo BO3. */
export function simulatePlayoffs(qualified: TournamentTeam[], rng: Rng): PlayoffsResult {
	const seeds = shuffle(qualified, rng);
	const playMatch = (a: TournamentTeam, b: TournamentTeam): BracketMatch => ({
		a,
		b,
		series: simulateSeries(a.strength, b.strength, 3, rng)
	});

	const quarterfinals = [
		playMatch(seeds[0], seeds[7]),
		playMatch(seeds[3], seeds[4]),
		playMatch(seeds[1], seeds[6]),
		playMatch(seeds[2], seeds[5])
	];
	const semifinals = [
		playMatch(winnerOf(quarterfinals[0]), winnerOf(quarterfinals[1])),
		playMatch(winnerOf(quarterfinals[2]), winnerOf(quarterfinals[3]))
	];
	const final = playMatch(winnerOf(semifinals[0]), winnerOf(semifinals[1]));

	return { quarterfinals, semifinals, final, champion: winnerOf(final) };
}

function collectUserMatches(
	user: TournamentTeam,
	swiss: SwissResult,
	playoffs: PlayoffsResult | undefined
): UserMatch[] {
	const userMatches: UserMatch[] = [];
	const push = (stage: string, m: { a: TournamentTeam; b: TournamentTeam; series: SeriesResult }) => {
		if (m.a.id !== user.id && m.b.id !== user.id) return;
		const userIsA = m.a.id === user.id;
		userMatches.push({
			stage,
			opponent: userIsA ? m.b : m.a,
			series: m.series,
			userWon: winnerOf(m).id === user.id,
			userIsA
		});
	};

	for (const round of swiss.rounds) {
		for (const m of round.matches) push(`Rodada ${round.number}`, m);
	}
	if (playoffs) {
		for (const m of playoffs.quarterfinals) push('Quartas de final', m);
		for (const m of playoffs.semifinals) push('Semifinal', m);
		push('Grande final', playoffs.final);
	}
	return userMatches;
}

function userFinishFrom(
	user: TournamentTeam,
	swiss: SwissResult,
	playoffs: PlayoffsResult | undefined
): UserFinish {
	if (!playoffs || !swiss.qualified.some((t) => t.id === user.id)) return 'fase suíça';
	if (playoffs.champion.id === user.id) return 'campeão';
	if (loserOf(playoffs.final).id === user.id) return 'vice';
	if (playoffs.semifinals.some((m) => loserOf(m).id === user.id)) return 'semi';
	return 'quartas';
}

/** Simula o Major completo: suíça com 16 times e playoffs com os 8 classificados. */
export function simulateTournament(
	user: TournamentTeam,
	opponents: TournamentTeam[],
	rng: Rng
): TournamentResult {
	const swiss = simulateSwiss([user, ...opponents], rng);
	const playoffs = swiss.qualified.length > 0 ? simulatePlayoffs(swiss.qualified, rng) : undefined;

	return {
		swiss,
		playoffs,
		userFinish: userFinishFrom(user, swiss, playoffs),
		userMatches: collectUserMatches(user, swiss, playoffs)
	};
}
