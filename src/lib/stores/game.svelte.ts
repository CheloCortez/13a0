import { browser } from '$app/environment';
import type { Major } from '$lib/data/types';
import type { Role } from '$lib/data/types';
import {
	createDraft,
	isComplete,
	pick as draftPick,
	reroll as draftReroll,
	setSlot as draftSetSlot,
	type DraftState,
	type GameMode
} from '$lib/engine/draft';
import { autoResolveVeto, type MapRecord } from '$lib/engine/maps';
import { buildOpponents } from '$lib/engine/opponents';
import { Rng, randomSeed } from '$lib/engine/rng';
import { effectiveRating, teamStrength } from '$lib/engine/strength';
import { type SeriesResult } from '$lib/engine/match';
import { simulateTournament, type TournamentResult } from '$lib/engine/tournament';

export type Phase = 'draft' | 'review' | 'tournament' | 'result';

interface SavedGame {
	version: 1;
	phase: Phase;
	draft: DraftState;
	revealed: number;
	userMapHistory?: MapRecord[];
}

const STORAGE_KEY = '13a0:campanha';
const UNLOCK_KEY = '13a0:conquistas';

/** Acesso a localStorage tolerante a falhas (modo anônimo, quota cheia, storage desativado). */
function safeGetItem(key: string): string | null {
	if (!browser) return null;
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

function safeSetItem(key: string, value: string): boolean {
	if (!browser) return false;
	try {
		localStorage.setItem(key, value);
		return true;
	} catch {
		return false;
	}
}

function safeRemoveItem(key: string): void {
	if (!browser) return;
	try {
		localStorage.removeItem(key);
	} catch {
		/* ignora — storage indisponível */
	}
}

function readHardUnlocked(): boolean {
	const raw = safeGetItem(UNLOCK_KEY);
	if (!raw) return false;
	try {
		return (JSON.parse(raw) as { hardUnlocked?: boolean }).hardUnlocked === true;
	} catch {
		return false;
	}
}

class GameStore {
	majors = $state<Major[]>([]);
	phase = $state<Phase>('draft');
	draft = $state<DraftState | null>(null);
	tournament = $state<TournamentResult | null>(null);
	revealed = $state(0);
	/** Histórico acumulado do usuário por mapa neste torneio (salvo em SavedGame). */
	userMapHistory = $state<MapRecord[]>([]);
	/** Histórico dos times adversários por mapa — calculado, não salvo. */
	private teamMapHistories: Record<string, MapRecord[]> = {};
	/** Verdadeiro quando o navegador recusou persistir o progresso (anônimo/quota). */
	persistFailed = $state(false);
	/** Modo difícil liberado após vencer um Major (persistido em localStorage). */
	hardUnlocked = $state(false);

	constructor() {
		this.hardUnlocked = readHardUnlocked();
	}

	/** Retorna o histórico acumulado do time oponente (partidas vs. bots, calculado). */
	getOpponentHistory(teamId: string): MapRecord[] {
		return this.teamMapHistories[teamId] ?? [];
	}

	/**
	 * Atualiza o histórico de mapas do usuário após uma partida concluída.
	 * Chame em finishLive() com os mapas do veto e o resultado da série.
	 */
	updateUserMapHistory(maps: import('$lib/engine/maps').CsMap[], series: SeriesResult, userIsA: boolean) {
		if (!maps.length) return;
		const history = [...this.userMapHistory];
		const userSide = userIsA ? 'A' : 'B';
		for (let i = 0; i < Math.min(maps.length, series.maps.length); i++) {
			const mapId = maps[i].id;
			const won = series.maps[i].winner === userSide;
			let rec = history.find((r) => r.mapId === mapId);
			if (!rec) { rec = { mapId, wins: 0, losses: 0 }; history.push(rec); }
			if (won) rec.wins++; else rec.losses++;
		}
		this.userMapHistory = history;
		this.save();
	}

	/** Calcula o histórico de mapas de todos os times (exceto user) a partir do torneio. */
	private computeTeamMapHistories(): Record<string, MapRecord[]> {
		if (!this.tournament || !this.draft) return {};
		const histories: Record<string, MapRecord[]> = {};
		let matchIndex = 0;

		const addResult = (teamId: string, mapId: string, won: boolean) => {
			if (!histories[teamId]) histories[teamId] = [];
			let rec = histories[teamId].find((r) => r.mapId === mapId);
			if (!rec) { rec = { mapId, wins: 0, losses: 0 }; histories[teamId].push(rec); }
			if (won) rec.wins++; else rec.losses++;
		};

		const processMatch = (
			aId: string, bId: string,
			series: SeriesResult,
			bestOf: 1 | 3 | 5
		) => {
			// Seed única e determinística para cada partida bot-vs-bot
			const seed = (this.draft!.seed ^ 0xcafebabe ^ (matchIndex * 0x6c62272e)) >>> 0;
			matchIndex++;
			if (aId === 'user' || bId === 'user') return; // user matches tracked separately
			const { selected } = autoResolveVeto(seed, bestOf);
			for (let i = 0; i < Math.min(selected.length, series.maps.length); i++) {
				const mapId = selected[i].id;
				const aWon = series.maps[i].winner === 'A';
				addResult(aId, mapId, aWon);
				addResult(bId, mapId, !aWon);
			}
		};

		const t = this.tournament;
		for (const round of t.swiss.rounds) {
			// Ordenação determinística dentro de cada rodada
			const sorted = [...round.matches].sort((a, b) =>
				(a.a.id + a.b.id).localeCompare(b.a.id + b.b.id)
			);
			for (const m of sorted) processMatch(m.a.id, m.b.id, m.series, m.bestOf);
		}
		if (t.playoffs) {
			for (const m of t.playoffs.quarterfinals) processMatch(m.a.id, m.b.id, m.series, 3);
			for (const m of t.playoffs.semifinals) processMatch(m.a.id, m.b.id, m.series, 3);
			processMatch(t.playoffs.final.a.id, t.playoffs.final.b.id, t.playoffs.final.series, 5);
		}
		return histories;
	}

	/** Libera o modo difícil ao terminar uma campanha como campeão (idempotente). */
	private maybeUnlockHard() {
		if (this.hardUnlocked) return;
		if (this.tournament?.userFinish !== 'campeão') return;
		this.hardUnlocked = true;
		safeSetItem(UNLOCK_KEY, JSON.stringify({ hardUnlocked: true }));
	}

	get mode(): GameMode {
		return this.draft?.mode ?? 'classic';
	}

	get seed(): number {
		return this.draft?.seed ?? 0;
	}

	get userStrength(): number {
		return this.draft ? teamStrength(this.draft.picks) : 0;
	}

	start(mode: GameMode, seed?: number) {
		this.draft = createDraft(this.majors, mode, seed ?? randomSeed());
		this.phase = 'draft';
		this.tournament = null;
		this.revealed = 0;
		this.userMapHistory = [];
		this.teamMapHistories = {};
		this.save();
	}

	pick(nick: string) {
		if (!this.draft) return;
		this.draft = draftPick(this.draft, this.majors, nick);
		if (isComplete(this.draft)) this.phase = 'review';
		this.save();
	}

	reroll() {
		if (!this.draft) return;
		this.draft = draftReroll(this.draft, this.majors);
		this.save();
	}

	/** Reatribui manualmente a função de um jogador na revisão (qualquer das 5, ou null = desescalar). */
	setSlot(nick: string, role: Role | null) {
		if (!this.draft) return;
		this.draft = { ...this.draft, picks: draftSetSlot(this.draft.picks, nick, role) };
		this.save();
	}

	/** Confirma o elenco e simula o Major inteiro (revelado etapa a etapa na UI). */
	confirm() {
		if (!this.draft) return;
		this.runTournament();
		this.phase = 'tournament';
		this.revealed = 0;
		this.save();
	}

	revealNext() {
		const stages = this.stageCount;
		if (this.revealed < stages) this.revealed++;
		if (this.revealed >= stages) {
			this.phase = 'result';
			this.maybeUnlockHard();
		}
		this.save();
	}

	/** Etapas existentes nesta campanha (eliminado na suíça não vê playoffs do próprio time). */
	get stageCount(): number {
		if (!this.tournament) return 0;
		return this.tournament.swiss.rounds.length + (this.tournament.playoffs ? 3 : 0);
	}

	reset() {
		this.draft = null;
		this.tournament = null;
		this.phase = 'draft';
		this.revealed = 0;
		this.userMapHistory = [];
		this.teamMapHistories = {};
		this.persistFailed = false;
		safeRemoveItem(STORAGE_KEY);
	}

	/** O torneio é determinístico a partir da seed do draft — recomputável ao retomar. */
	private runTournament() {
		if (!this.draft) return;
		const rng = new Rng((this.draft.seed ^ 0x9e3779b9) >>> 0);
		const opponents = buildOpponents(this.majors, rng, this.draft.mode === 'hard');
		const user = {
			id: 'user',
			name: 'Seu Time',
			strength: this.userStrength,
			isUser: true,
			players: this.draft.picks.map((p) => ({ nick: p.nick, rating: effectiveRating(p) }))
		};
		this.tournament = simulateTournament(user, opponents, rng);
		this.teamMapHistories = this.computeTeamMapHistories();
	}

	private save() {
		if (!browser || !this.draft) return;
		const saved: SavedGame = {
			version: 1,
			phase: this.phase,
			draft: this.draft,
			revealed: this.revealed,
			userMapHistory: this.userMapHistory.length ? this.userMapHistory : undefined
		};
		this.persistFailed = !safeSetItem(STORAGE_KEY, JSON.stringify(saved));
	}

	/** Retoma campanha salva; retorna false se não houver. */
	load(): boolean {
		const raw = safeGetItem(STORAGE_KEY);
		if (!raw) return false;
		try {
			const saved = JSON.parse(raw) as SavedGame;
			if (saved.version !== 1) return false;
			this.draft = saved.draft;
			this.phase = saved.phase;
			this.revealed = saved.revealed;
			this.userMapHistory = saved.userMapHistory ?? [];
			if (saved.phase === 'tournament' || saved.phase === 'result') this.runTournament();
			if (saved.phase === 'result') this.maybeUnlockHard();
			return true;
		} catch {
			return false;
		}
	}

	get hasSavedGame(): boolean {
		return safeGetItem(STORAGE_KEY) !== null;
	}
}

export const game = new GameStore();
