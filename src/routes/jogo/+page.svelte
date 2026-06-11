<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import PlayerCard from '$lib/components/PlayerCard.svelte';
	import SwissBoard from '$lib/components/SwissBoard.svelte';
	import TeamCard from '$lib/components/TeamCard.svelte';
	import { ROLE_LABELS, type Role } from '$lib/data/types';
	import { DRAFT_ORDER, type GameMode } from '$lib/engine/draft';
	import { computeAchievements, shareText } from '$lib/engine/share';
	import { effectiveRating } from '$lib/engine/strength';
	import type { SeriesResult } from '$lib/engine/match';
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

	const currentRole = $derived(game.draft ? DRAFT_ORDER[game.draft.round] : 'awp');
	const sortedPicks = $derived(
		game.draft
			? [...game.draft.picks].sort(
					(a, b) => DRAFT_ORDER.indexOf(a.slot) - DRAFT_ORDER.indexOf(b.slot)
				)
			: []
	);
	const hideRatings = $derived(game.mode === 'almanac' && game.phase === 'draft');

	const achievements = $derived(
		game.tournament ? computeAchievements(game.tournament.userMatches) : null
	);

	const stages = $derived.by(() => {
		if (!game.tournament) return [];
		const t = game.tournament;
		const list: { title: string; matches: { aName: string; bName: string; score: string; isUser: boolean; userWon: boolean }[] }[] = [];

		const fmtSeries = (s: SeriesResult, bestOf: number): string => {
			const mapScore = (m: SeriesResult['maps'][number]) =>
				`${m.scoreA}–${m.scoreB}${m.overtime ? ' (OT)' : ''}`;
			if (bestOf === 1) return mapScore(s.maps[0]);
			return `${s.scoreA}–${s.scoreB} (${s.maps.map(mapScore).join(', ')})`;
		};

		for (const round of t.swiss.rounds) {
			list.push({
				title: `Fase suíça — Rodada ${round.number}`,
				matches: round.matches.map((m) => ({
					aName: m.a.name,
					bName: m.b.name,
					score: fmtSeries(m.series, m.bestOf),
					isUser: m.a.id === 'user' || m.b.id === 'user',
					userWon:
						(m.series.winner === 'A' ? m.a.id : m.b.id) === 'user'
				}))
			});
		}
		if (t.playoffs) {
			const bracket = [
				{ title: 'Quartas de final', matches: t.playoffs.quarterfinals },
				{ title: 'Semifinais', matches: t.playoffs.semifinals },
				{ title: 'Grande final', matches: [t.playoffs.final] }
			];
			for (const stage of bracket) {
				list.push({
					title: stage.title,
					matches: stage.matches.map((m) => ({
						aName: m.a.name,
						bName: m.b.name,
						score: fmtSeries(m.series, 3),
						isUser: m.a.id === 'user' || m.b.id === 'user',
						userWon: (m.series.winner === 'A' ? m.a.id : m.b.id) === 'user'
					}))
				});
			}
		}
		return list;
	});

	const swissRoundCount = $derived(game.tournament?.swiss.rounds.length ?? 0);
	const lastSwissStage = $derived(
		game.revealed > 0 && game.revealed <= swissRoundCount ? stages[game.revealed - 1] : null
	);
	const playoffStages = $derived(stages.slice(swissRoundCount, game.revealed));

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
	<p class="muted">Carregando os Majors…</p>
{:else if game.phase === 'draft' && game.draft?.offer}
	{@const offer = game.draft.offer}
	<section>
		<header class="draft-header">
			<h2>Rodada {game.draft.round + 1}/5 — escalando <span class="role">{ROLE_LABELS[currentRole]}</span></h2>
			<p class="muted">
				Modo {game.mode === 'classic' ? 'Clássico' : 'Almanaque'} · seed #{game.seed}
			</p>
		</header>

		<div class="offer">
			<TeamCard title={offer.team.name} subtitle={offer.majorName} right={offer.team.placement}>
				{#each offer.team.players as player (player.nick)}
					<PlayerCard
						{player}
						hideRating={hideRatings}
						highlight={player.role === currentRole || player.role2 === currentRole}
						onclick={() => game.pick(player.nick)}
					/>
				{/each}
			</TeamCard>
			<p class="hint muted">
				Toque em um jogador para escalá-lo. Escolher fora da função aplica penalidade de 15% no
				rating.
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
					{#each DRAFT_ORDER as role (role)}
						{@const drafted = game.draft.picks.find((p) => p.slot === role)}
						{#if drafted}
							<PlayerCard player={drafted} hideRating={hideRatings} />
						{:else}
							<div class="empty-tile" class:next={role === currentRole}>
								<span class="empty-portrait" aria-hidden="true">?</span>
								<span class="badge badge-{role}">{ROLE_LABELS[role]}</span>
							</div>
						{/if}
					{/each}
				</TeamCard>
			</div>
		{/if}
	</section>
{:else if game.phase === 'review' && game.draft}
	<section>
		<h2>Seu time dos sonhos</h2>
		<p class="muted swap-hint">
			Ajuste as funções antes de jogar: mude a função de um jogador e ele troca de lugar com quem
			estiver nela. Fora da função natural há penalidade de 15%.
		</p>
		<TeamCard title="Seu Time" subtitle="seed #{game.seed}" right="força {game.userStrength.toFixed(3)}">
			{#each sortedPicks as p (p.nick)}
				<PlayerCard player={p} hideRating>
					{#snippet footer()}
						<div class="slot-box">
							<select
								class="slot-select"
								value={p.slot}
								onchange={(e) => game.swap(p.slot, e.currentTarget.value as Role)}
							>
								{#each DRAFT_ORDER as role (role)}
									<option value={role}>{ROLE_LABELS[role]}</option>
								{/each}
							</select>
							<span class="eff-rating">
								{effectiveRating(p).toFixed(2)}{#if effectiveRating(p) < p.rating}<span class="penalty" title="fora de função">▼</span>{/if}
							</span>
						</div>
					{/snippet}
				</PlayerCard>
			{/each}
		</TeamCard>
		<button class="btn big" onclick={() => game.confirm()}>🏆 Disputar o Major</button>
	</section>
{:else if (game.phase === 'tournament' || game.phase === 'result') && game.tournament}
	<section>
		<h2>O Major</h2>

		<h3 class="phase-title">Fase suíça</h3>
		<SwissBoard
			swiss={game.tournament.swiss}
			revealed={Math.min(game.revealed, swissRoundCount)}
		/>

		{#if lastSwissStage}
			<div class="panel stage">
				<h3>Resultados — {lastSwissStage.title}</h3>
				{#each lastSwissStage.matches as m (m.aName + m.bName)}
					<p class="match" class:user={m.isUser} class:won={m.isUser && m.userWon} class:lost={m.isUser && !m.userWon}>
						<span class="teams">{m.aName} <em>vs</em> {m.bName}</span>
						<span class="score">{m.score}</span>
					</p>
				{/each}
			</div>
		{/if}

		{#if playoffStages.length > 0}
			<h3 class="phase-title">Playoffs</h3>
		{/if}
		{#each playoffStages as stage (stage.title)}
			<div class="panel stage">
				<h3>{stage.title}</h3>
				{#each stage.matches as m (m.aName + m.bName)}
					<p class="match" class:user={m.isUser} class:won={m.isUser && m.userWon} class:lost={m.isUser && !m.userWon}>
						<span class="teams">{m.aName} <em>vs</em> {m.bName}</span>
						<span class="score">{m.score}</span>
					</p>
				{/each}
			</div>
		{/each}

		{#if game.phase === 'tournament'}
			<button class="btn big" onclick={() => game.revealNext()}>
				{#if game.revealed === 0}▶ Simular Rodada 1{:else if game.revealed < swissRoundCount}▶ Simular Rodada {game.revealed + 1}{:else if game.revealed === swissRoundCount}▶ Começar os playoffs{:else}▶ Próxima fase{/if}
			</button>
		{:else if achievements}
			{@const finish = game.tournament.userFinish}
			<div class="panel result" class:champion={finish === 'campeão'}>
				<h3>
					{#if finish === 'campeão'}🏆 CAMPEÃO DO MAJOR!{:else if finish === 'vice'}🥈 Vice-campeão{:else if finish === 'semi'}🥉 Caiu na semifinal{:else if finish === 'quartas'}Caiu nas quartas{:else}Eliminado na fase suíça{/if}
				</h3>
				{#if achievements.perfectMap}<p>💎 <strong>Mapa perfeito: 13 a 0!</strong></p>{/if}
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
	</section>
{/if}

<style>
	h2 {
		margin: 1rem 0 0.2rem;
	}

	.role {
		color: var(--accent);
	}

	.offer {
		margin-top: 1rem;
	}

	.hint {
		font-size: 0.8rem;
	}

	.picks {
		margin-top: 1rem;
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
		border: 1px dashed var(--border);
		border-radius: 8px;
		color: var(--muted);
		font-size: 1.6rem;
		font-weight: 800;
		background: color-mix(in srgb, var(--panel-2) 55%, transparent);
	}

	.empty-tile.next .empty-portrait {
		border-color: var(--accent);
		color: var(--accent);
	}

	.empty-tile .badge {
		font-size: 0.62rem;
		padding: 0.08rem 0.4rem;
	}

	.swap-hint {
		font-size: 0.85rem;
		margin: 0.2rem 0 0.8rem;
	}

	.slot-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
		width: 100%;
	}

	.slot-select {
		font: inherit;
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		background: var(--panel-2);
		color: var(--accent);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 0.22rem 0.2rem;
		cursor: pointer;
		max-width: 100%;
	}

	.slot-select:hover {
		border-color: var(--accent);
	}

	.eff-rating {
		font-weight: 700;
		font-size: 0.8rem;
		color: var(--accent);
		font-variant-numeric: tabular-nums;
	}

	.penalty {
		color: var(--loss);
		font-size: 0.75rem;
	}

	.big {
		width: 100%;
		margin-top: 1rem;
		padding: 1rem;
		font-size: 1.05rem;
	}

	.phase-title {
		margin: 1.2rem 0 0;
		font-size: 1rem;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.stage {
		margin-top: 1rem;
	}

	.stage h3 {
		margin: 0 0 0.6rem;
		font-size: 0.95rem;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.match {
		display: flex;
		justify-content: space-between;
		gap: 0.7rem;
		margin: 0.35rem 0;
		font-size: 0.88rem;
		padding: 0.3rem 0.5rem;
		border-radius: 6px;
	}

	.match em {
		color: var(--muted);
		font-style: normal;
		font-size: 0.78rem;
	}

	.match .score {
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
		color: var(--muted);
	}

	.match.user {
		font-weight: 700;
		background: var(--panel-2);
	}

	.match.won {
		border-left: 3px solid var(--win);
	}

	.match.lost {
		border-left: 3px solid var(--loss);
	}

	.result {
		margin-top: 1.2rem;
		text-align: center;
	}

	.result.champion {
		border-color: var(--accent);
	}

	.result h3 {
		margin-top: 0;
	}

	.grid-line {
		font-size: 1.3rem;
		letter-spacing: 0.1em;
	}

	.again {
		display: flex;
		gap: 0.7rem;
		margin-top: 1rem;
	}

	.again .btn-ghost {
		flex: 1;
	}
</style>
