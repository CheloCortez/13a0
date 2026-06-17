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
import { buildOpponents } from '$lib/engine/opponents';
import { Rng, randomSeed } from '$lib/engine/rng';
import { effectiveRating, teamStrength } from '$lib/engine/strength';
import { simulateTournament, type TournamentResult } from '$lib/engine/tournament';

export type Phase = 'draft' | 'review' | 'tournament' | 'result';

interface SavedGame {
	version: 1;
	phase: Phase;
	draft: DraftState;
	revealed: number;
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
	/** Verdadeiro quando o navegador recusou persistir o progresso (anônimo/quota). */
	persistFailed = $state(false);
	/** Modo difícil liberado após vencer um Major (persistido em localStorage). */
	hardUnlocked = $state(false);

	constructor() {
		this.hardUnlocked = readHardUnlocked();
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

	/** Reatribui manualmente a função de um jogador na revisão (qualquer das 5). */
	setSlot(nick: string, role: Role) {
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
			// Elenco com rating efetivo (com penalidades) — base das stats do box score.
			players: this.draft.picks.map((p) => ({ nick: p.nick, rating: effectiveRating(p) }))
		};
		this.tournament = simulateTournament(user, opponents, rng);
	}

	private save() {
		if (!browser || !this.draft) return;
		const saved: SavedGame = {
			version: 1,
			phase: this.phase,
			draft: this.draft,
			revealed: this.revealed
		};
		// Em falha de escrita (anônimo/quota) o jogo segue em memória; só sinaliza a UI.
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
