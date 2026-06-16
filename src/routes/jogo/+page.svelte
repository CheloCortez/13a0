<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import LiveMatch from '$lib/components/LiveMatch.svelte';
	import MatchupPreview from '$lib/components/MatchupPreview.svelte';
	import ModifierList from '$lib/components/ModifierList.svelte';
	import PlayerCard from '$lib/components/PlayerCard.svelte';
	import PlayoffBracket from '$lib/components/PlayoffBracket.svelte';
	import RoleBoard from '$lib/components/RoleBoard.svelte';
	import SwissBoard from '$lib/components/SwissBoard.svelte';
	import SwissBracket from '$lib/components/SwissBracket.svelte';
	import TeamCard from '$lib/components/TeamCard.svelte';
	import { DRAFT_ORDER, type GameMode } from '$lib/engine/draft';
	import { computeAchievements, shareText } from '$lib/engine/share';
	import { game } from '$lib/stores/game.svelte';
	import { loadAllMajors } from '$lib/data/loader';

	let ready = $state(false);
	let copied = $state(false);

	onMount(async () => {
		game.majors = await loadAllMajors();

		const params = page.url.searchParams;
		const novo = params.get('novo');
		const seedParam = params.get('seed');
		const modeParam = (params.get('mode') ?? 'classic') as GameMode;

		if (novo === 'classic' || novo === 'almanac') {
			game.start(novo);
			goto(`${base}/jogo`, { replaceState: true });
		} else if (seedParam) {
			game.start(modeParam, Number(seedParam));
			goto(`${base}/jogo`, { replaceState: true });
		} else if (!game.draft && !game.load()) {
			game.start('classic');
		}
		ready = true;
	});

	/** Funções ainda sem dono no time parcial (slot = função efetiva) — guia os destaques. */
	const vacantRoles = $derived(
		game.draft ? DRAFT_ORDER.filter((r) => !game.draft!.picks.some((p) => p.slot === r)) : []
	);
	const sortedPicks = $derived(
		game.draft
			? [...game.draft.picks].sort(
					(a, b) => DRAFT_ORDER.indexOf(a.slot) - DRAFT_ORDER.indexOf(b.slot)
				)
			: []
	);
	/** Almanaque: ratings, funções, colocações e modificadores ficam ocultos. */
	const almanac = $derived(game.mode === 'almanac');
	const hideRatings = $derived(almanac && game.phase === 'draft');

	const achievements = $derived(
		game.tournament ? computeAchievements(game.tournament.userMatches) : null
	);

	const swissRoundCount = $derived(game.tournament?.swiss.rounds.length ?? 0);
	/** Playoffs alcançados (há classificados e a suíça terminou de revelar). */
	const playoffsReached = $derived(!!game.tournament?.playoffs && game.revealed >= swissRoundCount);
	/** Fases de playoff já reveladas: 0 = só o chaveamento, 1 = quartas, 2 = semis, 3 = final. */
	const playoffRevealed = $derived(Math.max(0, Math.min(3, game.revealed - swissRoundCount)));

	/* ===== Partida ao vivo (round a round) das partidas do usuário ===== */
	let liveStageIndex = $state<number | null>(null);
	let playoffsEl = $state<HTMLElement | null>(null);

	const stageLabelAt = (idx: number) =>
		idx < swissRoundCount
			? `Rodada ${idx + 1}`
			: (['Quartas de final', 'Semifinal', 'Grande final'][idx - swissRoundCount] ?? '');

	function userMatchAt(idx: number) {
		const t = game.tournament;
		if (!t) return null;
		if (idx < swissRoundCount) {
			return (
				t.swiss.rounds[idx]?.matches.find((m) => m.a.id === 'user' || m.b.id === 'user') ?? null
			);
		}
		if (!t.playoffs) return null;
		const p = idx - swissRoundCount;
		const pool =
			p === 0 ? t.playoffs.quarterfinals : p === 1 ? t.playoffs.semifinals : [t.playoffs.final];
		return pool.find((m) => m.a.id === 'user' || m.b.id === 'user') ?? null;
	}

	const liveProps = $derived.by(() => {
		if (liveStageIndex === null) return null;
		const m = userMatchAt(liveStageIndex);
		if (!m) return null;
		const userIsA = m.a.id === 'user';
		const userTeam = userIsA ? m.a : m.b;
		const oppTeam = userIsA ? m.b : m.a;
		const photoByNick: Record<string, string> = {};
		for (const p of game.draft?.picks ?? []) photoByNick[p.nick.toLowerCase()] = p.majorId;
		return {
			seed: game.seed,
			stageLabel: stageLabelAt(liveStageIndex),
			user: { name: 'Seu Time', roster: userTeam.players ?? [] },
			opp: { name: oppTeam.name, roster: oppTeam.players ?? [] },
			oppLogoKey: oppTeam.id,
			oppMajorId: oppTeam.id.split('/')[0],
			userPhotoByNick: photoByNick,
			series: m.series,
			userIsA
		};
	});

	const stageActionLabel = (idx: number) =>
		idx < swissRoundCount
			? `Simular a Rodada ${idx + 1}`
			: (['Simular as quartas', 'Simular a semifinal', 'Simular a grande final'][
					idx - swissRoundCount
				] ?? 'Simular');

	/** Confronto da próxima partida do usuário (tela de "vs" antes de simular). */
	const nextMatchup = $derived.by(() => {
		if (game.phase !== 'tournament') return null;
		const m = userMatchAt(game.revealed);
		if (!m) return null;
		const opp = m.a.id === 'user' ? m.b : m.a;
		return {
			stageLabel: stageLabelAt(game.revealed),
			actionLabel: stageActionLabel(game.revealed),
			oppName: opp.name,
			oppLogoKey: opp.id
		};
	});

	/** Avança a campanha: anima a partida do usuário (se houver) antes de revelar a rodada. */
	function advance() {
		const idx = game.revealed;
		if (userMatchAt(idx)) liveStageIndex = idx;
		else game.revealNext();
	}
	async function finishLive() {
		const wasPlayoff = liveStageIndex !== null && liveStageIndex >= swissRoundCount;
		liveStageIndex = null;
		game.revealNext();
		if (wasPlayoff) {
			await tick();
			playoffsEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

	function copyShare() {
		if (!game.tournament) return;
		const url = `${page.url.origin}${base}/jogo?seed=${game.seed}&mode=${game.mode}`;
		const text = `${shareText({
			finish: game.tournament.userFinish,
			matches: game.tournament.userMatches,
			seed: game.seed,
			mode: game.mode
		})}\n${url}`;
		navigator.clipboard.writeText(text);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	function playAgain(mode: GameMode) {
		game.reset();
		game.start(mode);
	}
</script>

<svelte:head>
	<title>13 a 0 — campanha</title>
</svelte:head>

{#if !ready}
	<p class="muted loading">Carregando os Majors…</p>
{:else if game.phase === 'draft' && game.draft?.offer}
	{@const offer = game.draft.offer}
	<section>
		<header class="draft-header">
			<p class="tag">Draft — pick {game.draft.round + 1} de 5</p>
			<h2>Escolha <span class="role">um jogador</span></h2>
			<p class="meta-line">
				<span class="meta-chip">{game.mode === 'classic' ? 'Clássico' : 'Almanaque'}</span>
				<span class="meta-chip seed">seed #{game.seed}</span>
			</p>
		</header>

		<div class="offer">
			<TeamCard
				title={offer.team.name}
				subtitle={offer.majorName}
				right={almanac ? undefined : offer.team.placement}
				teamKey="{offer.majorId}/{offer.team.id}"
			>
				{#each offer.team.players as player (player.nick)}
					<PlayerCard
						{player}
						majorId={offer.majorId}
						hideRating={hideRatings}
						hideRoles={almanac}
						highlight={!almanac &&
							(vacantRoles.includes(player.role) ||
								(player.role2 != null && vacantRoles.includes(player.role2)))}
						onclick={() => game.pick(player.nick)}
					/>
				{/each}
			</TeamCard>
			<p class="hint muted">
				Toque em um jogador para escalá-lo — qualquer função, inclusive repetida. Os jogadores de
				funções que faltam no seu time aparecem destacados. Dois jogadores de uma mesma função
				reduzem a força; híbridos não geram conflito, e 3+ jogadores do mesmo time dão bônus.
			</p>
			<button
				class="btn btn-ghost"
				disabled={game.draft.rerollsLeft === 0}
				onclick={() => game.reroll()}
			>
				🎲 Re-sortear time ({game.draft.rerollsLeft} restante{game.draft.rerollsLeft === 1 ? '' : 's'})
			</button>
		</div>

		{#if game.draft.picks.length > 0}
			<div class="picks">
				<TeamCard title="Seu time até agora" subtitle="{game.draft.picks.length}/5">
					{#each sortedPicks as p (p.nick)}
						<PlayerCard player={p} majorId={p.majorId} hideRating={hideRatings} hideRoles={almanac} />
					{/each}
					{#each Array(5 - game.draft.picks.length) as _, i (i)}
						<div class="empty-tile">
							<span class="empty-portrait" aria-hidden="true">?</span>
						</div>
					{/each}
				</TeamCard>
				{#if !almanac}
					<ModifierList picks={game.draft.picks} />
				{/if}
			</div>
		{/if}
	</section>
{:else if game.phase === 'review' && game.draft}
	<section>
		<p class="tag">Escalação final</p>
		<h2>Monte o seu time</h2>
		<p class="muted swap-hint">
			Arraste cada jogador para a função que quiser — qualquer combinação vale, mesmo com
			penalidade.{#if !almanac} A força {game.userStrength.toFixed(3)} e os modificadores atualizam na hora.{/if}
		</p>
		<RoleBoard
			picks={game.draft.picks}
			onMove={(nick, role) => game.setSlot(nick, role)}
			hideRating={almanac}
			hideRoles={almanac}
		/>
		{#if !almanac}
			<ModifierList picks={game.draft.picks} />
		{/if}
		<button class="btn big" onclick={() => game.confirm()}>🏆 Disputar o Major</button>
	</section>
{:else if (game.phase === 'tournament' || game.phase === 'result') && game.tournament}
	<section>
		<p class="tag">Campanha</p>
		<h2>O Major</h2>

		{#if liveStageIndex !== null && liveProps}
			{#key liveStageIndex}
				<LiveMatch
					seed={liveProps.seed}
					stageLabel={liveProps.stageLabel}
					user={liveProps.user}
					opp={liveProps.opp}
					oppLogoKey={liveProps.oppLogoKey}
					oppMajorId={liveProps.oppMajorId}
					userPhotoByNick={liveProps.userPhotoByNick}
					series={liveProps.series}
					userIsA={liveProps.userIsA}
					onDone={finishLive}
				/>
			{/key}
		{:else}
			<h3 class="phase-title">Fase suíça</h3>
			<div class="swiss-wide">
				<SwissBracket
					swiss={game.tournament.swiss}
					revealed={Math.min(game.revealed, swissRoundCount)}
				/>
			</div>
			<div class="swiss-narrow">
				<SwissBoard
					swiss={game.tournament.swiss}
					revealed={Math.min(game.revealed, swissRoundCount)}
				/>
			</div>

			{#if playoffsReached && game.tournament.playoffs}
				<h3 class="phase-title" bind:this={playoffsEl}>Playoffs</h3>
				<PlayoffBracket playoffs={game.tournament.playoffs} revealed={playoffRevealed} />
			{/if}

			{#if game.phase === 'tournament'}
				{#if nextMatchup}
					<MatchupPreview
						stageLabel={nextMatchup.stageLabel}
						oppName={nextMatchup.oppName}
						oppLogoKey={nextMatchup.oppLogoKey}
						actionLabel={nextMatchup.actionLabel}
						onSimulate={advance}
					/>
				{:else}
					<button class="btn big" onclick={advance}>
						{#if game.revealed < swissRoundCount}▶ Revelar a Rodada {game.revealed + 1}{:else if game.revealed === swissRoundCount}▶ Começar os playoffs{:else}▶ Revelar a próxima fase{/if}
					</button>
				{/if}
			{:else if achievements}
			{@const finish = game.tournament.userFinish}
			<div class="panel result" class:champion={finish === 'campeão'}>
				<h3>
					{#if finish === 'campeão'}🏆 CAMPEÃO DO MAJOR!{:else if finish === 'vice'}🥈 Vice-campeão{:else if finish === 'semi'}🥉 Caiu na semifinal{:else if finish === 'quartas'}Caiu nas quartas{:else}Eliminado na fase suíça{/if}
				</h3>
				{#if achievements.perfectMap}<p class="perfect">💎 <strong>Mapa perfeito: 13 a 0!</strong></p>{/if}
				{#if achievements.unbeaten && finish === 'campeão'}<p>🔥 Campanha invicta!</p>{/if}
				<p class="grid-line">
					{#each game.tournament.userMatches as m (m.stage)}{m.userWon ? '🟩' : '🟥'}{/each}
				</p>
				<button class="btn" onclick={copyShare}>
					{copied ? '✓ Copiado!' : '📋 Copiar resultado'}
				</button>
			</div>
			<div class="again">
				<button class="btn btn-ghost" onclick={() => playAgain('classic')}>Jogar de novo — Clássico</button>
				<button class="btn btn-ghost" onclick={() => playAgain('almanac')}>Jogar de novo — Almanaque</button>
			</div>
			{/if}
		{/if}
	</section>
{/if}

<style>
	.loading {
		padding-top: 2rem;
		text-align: center;
	}

	h2 {
		margin: 0.2rem 0 0.3rem;
		font-size: 1.5rem;
	}

	section > .tag,
	.draft-header .tag {
		margin: 1.1rem 0 0;
	}

	.role {
		color: var(--accent);
	}

	.draft-header h2 {
		margin-bottom: 0.4rem;
	}

	.meta-line {
		display: flex;
		gap: 0.4rem;
		margin: 0;
	}

	.meta-chip {
		font-family: var(--font-display);
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--muted);
		background: var(--panel-2);
		box-shadow: inset 0 0 0 1px var(--border);
		padding: 0.14rem 0.5rem;
	}

	.meta-chip.seed {
		font-variant-numeric: tabular-nums;
	}

	.offer {
		margin-top: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.offer .btn-ghost {
		align-self: flex-start;
	}

	.hint {
		font-size: 0.8rem;
		margin: 0;
	}

	.picks {
		margin-top: 1.2rem;
	}

	.empty-tile {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3rem;
		min-width: 0;
	}

	.empty-portrait {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		aspect-ratio: 4 / 5;
		border: 1px dashed var(--border-strong);
		color: var(--muted);
		font-family: var(--font-display);
		font-size: 1.7rem;
		font-weight: 700;
		background: color-mix(in srgb, var(--panel-2) 55%, transparent);
		clip-path: polygon(var(--cut-sm) 0, 100% 0, 100% calc(100% - var(--cut-sm)), calc(100% - var(--cut-sm)) 100%, 0 100%, 0 var(--cut-sm));
	}

	.swap-hint {
		font-size: 0.85rem;
		margin: 0.2rem 0 0.9rem;
	}

	.big {
		width: 100%;
		margin-top: 1.1rem;
		padding: 1rem;
		font-size: 1.1rem;
	}

	.phase-title {
		margin: 1.4rem 0 0;
		font-size: 0.85rem;
		color: var(--muted);
		letter-spacing: 0.14em;
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.phase-title::after {
		content: '';
		flex: 1;
		height: 1px;
		background: linear-gradient(90deg, var(--border-strong), transparent);
	}

	/* ===== Fase suíça: bracket no desktop, quadro vertical no celular ===== */
	/* O bracket "estoura" o cap de 700px do main, centralizado sobre o viewport. */
	.swiss-wide {
		width: min(96vw, 1040px);
		margin-left: calc((100% - min(96vw, 1040px)) / 2);
	}

	.swiss-narrow {
		display: none;
	}

	@media (max-width: 820px) {
		.swiss-wide {
			display: none;
		}
		.swiss-narrow {
			display: block;
		}
	}

	/* ===== Resultado final ===== */
	.result {
		margin-top: 1.3rem;
		text-align: center;
		padding: 1.4rem 1rem;
	}

	.result.champion {
		border-color: color-mix(in srgb, var(--accent) 65%, var(--border));
		border-top-color: var(--accent);
		background:
			radial-gradient(30rem 12rem at 50% -4rem, rgba(246, 168, 33, 0.16), transparent 70%),
			linear-gradient(180deg, var(--panel-2), var(--panel));
		position: relative;
		overflow: hidden;
	}

	/* Brilho varrendo o painel de campeão */
	.result.champion::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(115deg, transparent 35%, rgba(255, 210, 120, 0.1) 50%, transparent 65%);
		background-size: 250% 100%;
		animation: shine 3.2s ease-in-out infinite;
		pointer-events: none;
	}

	@keyframes shine {
		from {
			background-position: 120% 0;
		}
		to {
			background-position: -120% 0;
		}
	}

	.result h3 {
		margin: 0 0 0.6rem;
		font-size: 1.3rem;
		letter-spacing: 0.06em;
	}

	.result.champion h3 {
		color: var(--accent-bright);
		text-shadow: 0 0 22px rgba(246, 168, 33, 0.45);
	}

	.perfect {
		color: var(--awp);
	}

	.grid-line {
		font-size: 1.3rem;
		letter-spacing: 0.12em;
	}

	.again {
		display: flex;
		gap: 0.7rem;
		margin-top: 1rem;
	}

	.again .btn-ghost {
		flex: 1;
	}

	@media (max-width: 440px) {
		.again {
			flex-direction: column;
		}

		.offer .btn-ghost {
			align-self: stretch;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.result.champion::after {
			animation: none;
		}
	}
</style>
