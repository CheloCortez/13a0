<script lang="ts">
	import { base } from '$app/paths';
	import { teamLogos } from '$lib/data/teamLogos';
	import { generateBoxScore, boxScoreSeed } from '$lib/engine/boxscore';
	import type { SeriesResult } from '$lib/engine/match';
	import type { RosterPlayer } from '$lib/engine/tournament';
	import type { CsMap } from '$lib/engine/maps';
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
		maps: csMapList,
		onDone
	}: {
		seed: number;
		stageLabel: string;
		user: Side;
		opp: Side;
		oppLogoKey: string;
		oppMajorId: string;
		userPhotoByNick: Record<string, string>;
		series: SeriesResult;
		userIsA: boolean;
		/** Mapas do veto em ordem (com thumbnail). Se ausente, usa texto simples. */
		maps?: CsMap[];
		onDone: () => void;
	} = $props();

	const TICK = 300;
	const TICK_EVENT = 900; // pausa extra apenas para overtime
	const END_PAUSE = 1100;
	const reduced =
		typeof window !== 'undefined' &&
		window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

	const seriesMaps = $derived(series.maps);
	const userSide = $derived<'A' | 'B'>(userIsA ? 'A' : 'B');

	let mapIndex = $state(0);
	let revealed = $state(0);
	let phase = $state<'playing' | 'mapdone'>('playing');
	let timer: ReturnType<typeof setInterval> | undefined;
	let endTimer: ReturnType<typeof setTimeout> | undefined;
	let eventTimer: ReturnType<typeof setTimeout> | undefined;
	let showOvertime = $state(false);

	const curMap = $derived(seriesMaps[mapIndex]);
	const shown = $derived(curMap.rounds.slice(0, revealed));
	const liveUser = $derived(shown.filter((w) => w === userSide).length);
	const liveOpp = $derived(shown.length - liveUser);
	const lastWinner = $derived(shown.length ? shown[shown.length - 1] : null);

	const seriesTally = $derived.by(() => {
		let u = 0, o = 0;
		for (let i = 0; i <= mapIndex; i++) {
			if (i === mapIndex && phase !== 'mapdone') break;
			if (seriesMaps[i].winner === userSide) u++;
			else o++;
		}
		return { u, o };
	});

	// Histórico de mapas já concluídos (índices 0..mapIndex-1)
	const mapHistory = $derived.by(() => {
		if (!csMapList || mapIndex === 0) return [];
		return seriesMaps.slice(0, mapIndex).map((m, i) => {
			const uScore = userIsA ? m.scoreA : m.scoreB;
			const oScore = userIsA ? m.scoreB : m.scoreA;
			return {
				csMap: csMapList[i],
				uScore,
				oScore,
				userWon: m.winner === userSide
			};
		});
	});

	$effect(() => {
		mapIndex;
		revealed = 0;
		phase = 'playing';
		showOvertime = false;
		clearInterval(timer);
		clearTimeout(endTimer);
		clearTimeout(eventTimer);
		const curRounds = seriesMaps[mapIndex].rounds;
		const total = curRounds.length;
		if (reduced || total === 0) {
			revealed = total;
			phase = 'mapdone';
			return;
		}

		function tick() {
			const idx = revealed;
			revealed++;
			const prevShown = curRounds.slice(0, idx);
			const prevA = prevShown.filter((w) => w === 'A').length;
			const prevB = prevShown.length - prevA;
			// Só detectar overtime
			const isOt = prevA === 12 && prevB === 12;
			if (isOt) showOvertime = true;

			if (revealed >= total) {
				clearInterval(timer);
				endTimer = setTimeout(() => {
					showOvertime = false;
					phase = 'mapdone';
				}, END_PAUSE);
				return;
			}

			if (isOt && !reduced) {
				clearInterval(timer);
				eventTimer = setTimeout(() => {
					showOvertime = false;
					timer = setInterval(tick, TICK);
				}, TICK_EVENT);
			}
		}

		timer = setInterval(tick, TICK);
		return () => {
			clearInterval(timer);
			clearTimeout(endTimer);
			clearTimeout(eventTimer);
		};
	});

	function skip() {
		clearInterval(timer);
		clearTimeout(endTimer);
		clearTimeout(eventTimer);
		showOvertime = false;
		revealed = curMap.rounds.length;
		phase = 'mapdone';
	}
	function next() {
		if (mapIndex < seriesMaps.length - 1) mapIndex++;
		else onDone();
	}

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
	const isLast = $derived(mapIndex >= seriesMaps.length - 1);
	const currentCsMap = $derived(csMapList?.[mapIndex]);
</script>

<div class="live">
	<p class="stage-tag">{stageLabel}</p>

	<!-- Histórico de mapas anteriores na série -->
	{#if mapHistory.length > 0}
		<div class="map-history">
			{#each mapHistory as h (h.csMap?.id ?? h.uScore)}
				<div class="map-card hist-card" class:hist-won={h.userWon} class:hist-lost={!h.userWon}>
					{#if h.csMap}
						<img class="map-thumb" src="{base}{h.csMap.image}" alt={h.csMap.name} />
					{/if}
					<span class="map-card-name hist-name">{h.csMap?.name ?? '—'}</span>
					<span class="map-num hist-score" class:score-won={h.userWon} class:score-lost={!h.userWon}>
						{h.uScore}–{h.oScore}
					</span>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Card do mapa atual — sempre abaixo do histórico -->
	{#if currentCsMap}
		<div class="map-card map-card-current">
			<img class="map-thumb" src="{base}{currentCsMap.image}" alt={currentCsMap.name} />
			<span class="map-card-name">{currentCsMap.name}</span>
			{#if seriesMaps.length > 1}
				<span class="map-num">Mapa {mapIndex + 1}</span>
			{/if}
		</div>
	{:else}
		{#if seriesMaps.length > 1}
			<p class="map-text-fallback">Mapa {mapIndex + 1}</p>
		{/if}
	{/if}

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

	{#if showOvertime}
		<div class="round-event" role="status" aria-live="polite">⏱ Overtime!</div>
	{/if}

	{#if seriesMaps.length > 1}
		<p class="series-tally">Série {seriesTally.u}–{seriesTally.o}</p>
	{/if}

	{#if phase === 'playing'}
		<div class="live-foot">
			<button class="btn btn-ghost skip" onclick={skip}>⏭ Pular</button>
		</div>
	{:else if board}
		{@const m = curMap}
		<MatchScoreboard
			caption="{currentCsMap?.name ?? `Mapa ${mapIndex + 1}`} — {m.scoreA}–{m.scoreB}{m.overtime ? ' (prorrogação)' : ''}"
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

	/* Card do mapa atual */
	.map-card {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		padding: 0.3rem 0.7rem 0.3rem 0.3rem;
		background: var(--panel-2);
		border: 1px solid var(--border);
		border-left: 3px solid var(--accent);
		overflow: hidden;
	}

	.map-thumb {
		width: 96px;
		height: 54px;
		object-fit: cover;
		flex-shrink: 0;
		display: block;
	}

	.map-card-name {
		flex: 1;
		font-family: var(--font-display);
		font-size: 1.05rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--accent-bright);
	}

	.map-num {
		font-family: var(--font-display);
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--muted);
		flex-shrink: 0;
	}

	/* Mapa atual: borda accent mais forte que o histórico */
	.map-card-current {
		border-left-color: var(--accent);
		border-left-width: 4px;
	}

	.map-text-fallback {
		margin: 0;
		font-family: var(--font-display);
		font-size: 0.8rem;
		color: var(--muted);
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	/* Histórico de mapas da série */
	.map-history {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	/* Cards do histórico — mesma estrutura que .map-card, diferenciados por opacidade e cor */
	.hist-card {
		opacity: 0.75;
		border-left-color: var(--border-strong);
	}

	.hist-card .map-thumb {
		filter: brightness(0.7);
	}

	.hist-card .map-card-name {
		color: var(--muted);
	}

	.hist-card.hist-won {
		border-left-color: var(--win);
	}

	.hist-card.hist-lost {
		border-left-color: var(--loss);
	}

	.hist-score.score-won {
		color: var(--win);
	}

	.hist-score.score-lost {
		color: var(--loss);
	}

	/* Placar ao vivo */
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

	.num.user { color: var(--accent-bright); }
	.num.opp  { color: var(--ct); }

	.num.pop {
		transform: scale(1.28);
	}

	.sep {
		color: var(--muted);
		font-size: 1.8rem;
	}

	/* Overtime badge */
	.round-event {
		text-align: center;
		font-family: var(--font-display);
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #f6d860;
		padding: 0.25rem 0.8rem;
		background: color-mix(in srgb, #f6d860 12%, var(--panel-2));
		border: 1px solid color-mix(in srgb, #f6d860 35%, transparent);
		clip-path: polygon(
			var(--cut-sm) 0, 100% 0,
			100% calc(100% - var(--cut-sm)),
			calc(100% - var(--cut-sm)) 100%,
			0 100%, 0 var(--cut-sm)
		);
		animation: evt-in 0.18s ease forwards;
	}

	@keyframes evt-in {
		from { opacity: 0; transform: translateY(-4px); }
		to   { opacity: 1; transform: translateY(0); }
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
		.num { transition: none; }
		.num.pop { transform: none; }
		.round-event { animation: none; }
	}
</style>
