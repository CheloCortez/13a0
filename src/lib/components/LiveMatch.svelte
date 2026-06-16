<script lang="ts">
	import { base } from '$app/paths';
	import { teamLogos } from '$lib/data/teamLogos';
	import { generateBoxScore, boxScoreSeed } from '$lib/engine/boxscore';
	import type { SeriesResult } from '$lib/engine/match';
	import type { RosterPlayer } from '$lib/engine/tournament';
	import MatchScoreboard, { type ScoreTeam } from './MatchScoreboard.svelte';

	interface Side {
		name: string;
		roster: RosterPlayer[];
	}

	let {
		seed,
		stageLabel,
		user,
		opp,
		oppLogoKey,
		oppMajorId,
		userPhotoByNick,
		series,
		userIsA,
		onDone
	}: {
		seed: number;
		stageLabel: string;
		user: Side;
		opp: Side;
		/** Chave `${majorId}/${teamId}` da logo do oponente. */
		oppLogoKey: string;
		/** Major do oponente (fotos da época). */
		oppMajorId: string;
		/** nick(lower) -> majorId de origem, p/ a foto da época do usuário. */
		userPhotoByNick: Record<string, string>;
		series: SeriesResult;
		userIsA: boolean;
		onDone: () => void;
	} = $props();

	const TICK = 300; // ms por round — cadência mais lenta e tensa
	const END_PAUSE = 1100; // beat no placar final antes de revelar o scoreboard
	const reduced =
		typeof window !== 'undefined' &&
		window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

	const maps = $derived(series.maps);
	const userSide = $derived<'A' | 'B'>(userIsA ? 'A' : 'B');

	let mapIndex = $state(0);
	let revealed = $state(0);
	let phase = $state<'playing' | 'mapdone'>('playing');
	let timer: ReturnType<typeof setInterval> | undefined;
	let endTimer: ReturnType<typeof setTimeout> | undefined;

	const curMap = $derived(maps[mapIndex]);
	const shown = $derived(curMap.rounds.slice(0, revealed));
	const liveUser = $derived(shown.filter((w) => w === userSide).length);
	const liveOpp = $derived(shown.length - liveUser);
	const lastWinner = $derived(shown.length ? shown[shown.length - 1] : null);

	// série: mapas já vencidos até aqui (inclui o mapa atual se terminado)
	const seriesTally = $derived.by(() => {
		let u = 0,
			o = 0;
		for (let i = 0; i <= mapIndex; i++) {
			if (i === mapIndex && phase !== 'mapdone') break;
			if (maps[i].winner === userSide) u++;
			else o++;
		}
		return { u, o };
	});

	$effect(() => {
		mapIndex; // re-roda ao trocar de mapa
		revealed = 0;
		phase = 'playing';
		clearInterval(timer);
		clearTimeout(endTimer);
		const total = maps[mapIndex].rounds.length;
		if (reduced || total === 0) {
			revealed = total;
			phase = 'mapdone';
			return;
		}
		timer = setInterval(() => {
			revealed++;
			if (revealed >= total) {
				revealed = total;
				clearInterval(timer);
				// segura o placar final por um instante antes do scoreboard
				endTimer = setTimeout(() => (phase = 'mapdone'), END_PAUSE);
			}
		}, TICK);
		return () => {
			clearInterval(timer);
			clearTimeout(endTimer);
		};
	});

	function skip() {
		clearInterval(timer);
		clearTimeout(endTimer);
		revealed = curMap.rounds.length;
		phase = 'mapdone';
	}
	function next() {
		if (mapIndex < maps.length - 1) mapIndex++;
		else onDone();
	}

	// scoreboard do mapa terminado
	const board = $derived.by(() => {
		if (phase !== 'mapdone') return null;
		const bs = generateBoxScore(
			userIsA ? user.roster : opp.roster,
			userIsA ? opp.roster : user.roster,
			curMap,
			boxScoreSeed(seed, stageLabel, mapIndex)
		);
		const userLines = userIsA ? bs.a : bs.b;
		const oppLines = userIsA ? bs.b : bs.a;
		const uScore = userIsA ? curMap.scoreA : curMap.scoreB;
		const oScore = userIsA ? curMap.scoreB : curMap.scoreA;
		const userWon = curMap.winner === userSide;
		const teamA: ScoreTeam = {
			name: user.name,
			isUser: true,
			score: uScore,
			won: userWon,
			players: userLines.map((l) => ({ ...l, majorId: userPhotoByNick[l.nick.toLowerCase()] }))
		};
		const teamB: ScoreTeam = {
			name: opp.name,
			logoKey: oppLogoKey,
			score: oScore,
			won: !userWon,
			players: oppLines.map((l) => ({ ...l, majorId: oppMajorId }))
		};
		return { teamA, teamB };
	});

	const oppLogo = $derived(teamLogos[oppLogoKey]);
	const isLast = $derived(mapIndex >= maps.length - 1);
</script>

<div class="live">
	<p class="stage-tag">{stageLabel}{#if maps.length > 1} · Mapa {mapIndex + 1}{/if}</p>

	<div class="board-live" class:done={phase === 'mapdone'}>
		<div class="team-side user">
			<span class="crest" aria-hidden="true">★</span>
			<span class="tname">{user.name}</span>
		</div>
		<div class="score">
			<span class="num user" class:pop={lastWinner === userSide && phase === 'playing'}>{liveUser}</span>
			<span class="sep">:</span>
			<span class="num opp" class:pop={lastWinner !== userSide && lastWinner !== null && phase === 'playing'}>{liveOpp}</span>
		</div>
		<div class="team-side opp">
			{#if oppLogo}<img class="crest" src="{base}/teamlogos/{oppLogo}" alt="" />{:else}<span class="crest">●</span>{/if}
			<span class="tname">{opp.name}</span>
		</div>
	</div>

	{#if maps.length > 1}
		<p class="series-tally">Série {seriesTally.u}–{seriesTally.o}</p>
	{/if}

	{#if phase === 'playing'}
		<div class="live-foot">
			<button class="btn btn-ghost skip" onclick={skip}>⏭ Pular</button>
		</div>
	{:else if board}
		{@const m = curMap}
		<MatchScoreboard
			caption="Mapa {mapIndex + 1} — {m.scoreA}–{m.scoreB}{m.overtime ? ' (prorrogação)' : ''}"
			teamA={board.teamA}
			teamB={board.teamB}
		/>
		<button class="btn big" onclick={next}>
			{#if !isLast}▶ Próximo mapa{:else}✓ Continuar{/if}
		</button>
	{/if}
</div>

<style>
	.live {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
		margin-top: 1rem;
	}

	.stage-tag {
		margin: 0;
		font-family: var(--font-display);
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--accent);
	}

	.board-live {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: 0.8rem;
		padding: 1rem;
		background:
			radial-gradient(24rem 10rem at 50% -3rem, rgba(246, 168, 33, 0.08), transparent 70%),
			linear-gradient(180deg, var(--panel-2), var(--panel));
		border: 1px solid var(--border);
		border-top: 2px solid var(--border-strong);
	}

	.team-side {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 0;
	}

	.team-side.opp {
		justify-content: flex-end;
		text-align: right;
	}

	.team-side .crest {
		width: 2rem;
		height: 2rem;
		object-fit: contain;
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.team-side.user .crest {
		color: var(--accent);
	}

	.tname {
		font-family: var(--font-display);
		font-size: 0.92rem;
		font-weight: 700;
		text-transform: uppercase;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.team-side.user .tname {
		color: var(--accent-bright);
	}

	.score {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-family: var(--font-display);
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}

	.num {
		font-size: 2.6rem;
		line-height: 1;
		min-width: 1.6ch;
		text-align: center;
		transition: transform 0.12s ease;
	}

	.num.user {
		color: var(--accent-bright);
	}

	.num.opp {
		color: var(--ct);
	}

	.num.pop {
		transform: scale(1.28);
	}

	.sep {
		color: var(--muted);
		font-size: 1.8rem;
	}

	.series-tally {
		margin: -0.2rem 0 0;
		text-align: center;
		font-family: var(--font-display);
		font-size: 0.78rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.live-foot {
		display: flex;
		align-items: center;
		justify-content: flex-end;
	}

	.skip {
		padding: 0.5rem 1rem;
		font-size: 0.85rem;
	}

	.big {
		width: 100%;
		padding: 0.9rem;
		font-size: 1.05rem;
	}

	@media (prefers-reduced-motion: reduce) {
		.num {
			transition: none;
		}
		.num.pop {
			transform: none;
		}
	}
</style>
