<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import LiveMatch from '$lib/components/LiveMatch.svelte';
	import MapVeto from '$lib/components/MapVeto.svelte';
	import MatchupPreview from '$lib/components/MatchupPreview.svelte';
	import ModifierList from '$lib/components/ModifierList.svelte';
	import FinalRoster from '$lib/components/FinalRoster.svelte';
	import PlayerCard from '$lib/components/PlayerCard.svelte';
	import PlayoffBracket from '$lib/components/PlayoffBracket.svelte';
	import RoleBoard from '$lib/components/RoleBoard.svelte';
	import SwissBoard from '$lib/components/SwissBoard.svelte';
	import SwissBracket from '$lib/components/SwissBracket.svelte';
	import TeamCard from '$lib/components/TeamCard.svelte';
	import { DRAFT_ORDER, type GameMode } from '$lib/engine/draft';
	import type { CsMap } from '$lib/engine/maps';
	import { computeAchievements, shareText } from '$lib/engine/share';
	import { game } from '$lib/stores/game.svelte';
	import { loadAllMajors } from '$lib/data/loader';
	import Seo from '$lib/components/Seo.svelte';
	import SupportBlock from '$lib/components/SupportBlock.svelte';
	import AdSlot from '$lib/components/AdSlot.svelte';
	import { writeClipboard } from '$lib/clipboard';

	let ready = $state(false);
	let loadError = $state(false);
	let copied = $state(false);
	let showDraftHint = $state(false);

	async function boot() {
		loadError = false;
		try {
			game.majors = await loadAllMajors();
		} catch {
			loadError = true;
			return;
		}

		const params = page.url.searchParams;
		const novoRaw = params.get('novo');
		const seedParam = params.get('seed');
		const modeRaw = params.get('mode');

		// Resolve o modo, validando contra os valores conhecidos. O Difícil exige desbloqueio:
		// uma URL com hard sem a conquista cai para o Clássico.
		const resolveMode = (raw: string | null): GameMode => {
			const m: GameMode = raw === 'almanac' || raw === 'hard' ? raw : 'classic';
			return m === 'hard' && !game.hardUnlocked ? 'classic' : m;
		};
		const novo = novoRaw === 'classic' || novoRaw === 'almanac' || novoRaw === 'hard' ? novoRaw : null;

		if (novo) {
			game.start(resolveMode(novo));
			goto(`${base}/jogo`, { replaceState: true });
		} else if (seedParam) {
			const seed = Number(seedParam);
			game.start(resolveMode(modeRaw), Number.isInteger(seed) && seed >= 0 ? seed : undefined);
			goto(`${base}/jogo`, { replaceState: true });
		} else if (!game.draft && !game.load()) {
			game.start('classic');
		}
		ready = true;
	}

	onMount(boot);

	/** Funções ainda sem dono no time parcial (slot = função efetiva) — guia os destaques. */
	const vacantRoles = $derived(
		game.draft ? DRAFT_ORDER.filter((r) => !game.draft!.picks.some((p) => p.slot === r)) : []
	);
	const sortedPicks = $derived(
		game.draft
			? [...game.draft.picks].sort((a, b) => {
					const ia = a.slot !== null ? DRAFT_ORDER.indexOf(a.slot) : Infinity;
					const ib = b.slot !== null ? DRAFT_ORDER.indexOf(b.slot) : Infinity;
					return ia - ib;
				})
			: []
	);
	/** Jogo às cegas: ratings/funções/colocações/força ocultos — vale para Almanaque e Difícil. */
	const blind = $derived(game.mode === 'almanac' || game.mode === 'hard');
	/** Todos os jogadores têm slot atribuído (false apenas em modos cegos com alocação pendente). */
	const allAssigned = $derived(game.draft?.picks.every((p) => p.slot !== null) ?? true);
	const hideRatings = $derived(blind && game.phase === 'draft');
	const modeLabel = $derived(
		game.mode === 'classic' ? 'Clássico' : game.mode === 'hard' ? 'Difícil' : 'Às cegas'
	);

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
	/** Mapas definidos pelo veto; null = veto ainda não concluído para esta partida. */
	let vetoMaps = $state<CsMap[] | null>(null);

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

	/** bestOf da partida em andamento (para o veto). */
	const liveBestOf = $derived.by((): 1 | 3 | 5 => {
		if (liveStageIndex === null) return 1;
		if (liveStageIndex < swissRoundCount) {
			// SwissMatch tem bestOf: 1 | 3
			const m = userMatchAt(liveStageIndex) as { bestOf?: 1 | 3 } | null;
			return m?.bestOf ?? 1;
		}
		const playoffPhase = liveStageIndex - swissRoundCount;
		// 0=quartas, 1=semis: BO3; 2=final: BO5
		return playoffPhase >= 2 ? 5 : 3;
	});

	/** Seed para o veto: gameSeed XOR índice da partida (determinístico por campanha). */
	const vetoSeed = $derived(
		liveStageIndex !== null ? (game.seed ^ (liveStageIndex * 0x9e3779b9)) >>> 0 : 0
	);

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
		if (userMatchAt(idx)) {
			vetoMaps = null; // reseta veto para nova partida
			liveStageIndex = idx;
		} else {
			game.revealNext();
		}
	}
	async function finishLive() {
		const wasPlayoff = liveStageIndex !== null && liveStageIndex >= swissRoundCount;
		// Atualiza histórico de mapas do usuário antes de limpar vetoMaps
		if (vetoMaps && liveProps) {
			game.updateUserMapHistory(vetoMaps, liveProps.series, liveProps.userIsA);
		}
		vetoMaps = null;
		liveStageIndex = null;
		game.revealNext();
		if (wasPlayoff) {
			await tick();
			playoffsEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

	/** Copia via Clipboard API com fallback para execCommand (HTTP, navegadores antigos, modo privado). */
	async function copyShare() {
		if (!game.tournament || !game.draft) return;
		const text = shareText({
			finish: game.tournament.userFinish,
			matches: game.tournament.userMatches,
			seed: game.seed,
			mode: game.mode,
			picks: game.draft.picks
		});
		if (await writeClipboard(text)) {
			copied = true;
			setTimeout(() => (copied = false), 2000);
		}
	}

	function playAgain(mode: GameMode) {
		game.reset();
		game.start(mode);
	}
</script>

<Seo
	title="13 a 0 — campanha"
	description="Faça o draft do seu time dos sonhos do CS e simule um Major inteiro — fase suíça e playoffs — em busca do 13 a 0."
	path="/jogo"
/>

{#if game.persistFailed}
	<p class="persist-warn" role="status">
		Seu progresso não está sendo salvo neste navegador (modo anônimo ou armazenamento cheio). Você
		pode jogar normalmente, mas a campanha some ao fechar a aba.
	</p>
{/if}

{#if loadError}
	<section class="load-error">
		<p class="tag">Ops</p>
		<h2>Não foi possível carregar os Majors</h2>
		<p class="muted">Verifique sua conexão e tente novamente.</p>
		<button class="btn" onclick={boot}>Tentar de novo</button>
	</section>
{:else if !ready}
	<p class="muted loading">Carregando os Majors…</p>
{:else if game.phase === 'draft' && game.draft?.offer}
	{@const offer = game.draft.offer}
	<section>
		<header class="draft-header">
			<p class="tag">Draft — pick {game.draft.round + 1} de 5</p>
			<h2>Escolha <span class="role">um jogador</span></h2>
			<p class="meta-line">
				<span class="meta-chip">{modeLabel}</span>
				<span class="meta-chip seed">seed #{game.seed}</span>
			</p>
		</header>

		<div class="offer">
			<TeamCard
				title={offer.team.name}
				subtitle={offer.majorName}
				right={blind ? undefined : offer.team.placement}
				teamKey="{offer.majorId}/{offer.team.id}"
			>
				{#each offer.team.players as player (player.nick)}
					<PlayerCard
						{player}
						majorId={offer.majorId}
						hideRating={hideRatings}
						hideRoles={blind}
						highlight={!blind &&
							(vacantRoles.includes(player.role) ||
								(player.role2 != null && vacantRoles.includes(player.role2)))}
						onclick={() => game.pick(player.nick)}
					/>
				{/each}
			</TeamCard>
			<div class="offer-footer">
				<span class="hint-tip">
					<button
						type="button"
						class="hint-btn"
						class:active={showDraftHint}
						aria-expanded={showDraftHint}
						aria-label="Dica de draft"
						onclick={() => (showDraftHint = !showDraftHint)}
					>?</button>
					{#if showDraftHint}
						<span role="tooltip" class="tip-text">
							Toque num jogador para escalá-lo — qualquer função, inclusive repetida. Jogadores de
							funções que faltam no seu time ficam destacados. Dois do mesmo papel reduzem a força;
							híbridos não geram conflito, e 3+ do mesmo time dão bônus de sinergia.
						</span>
					{/if}
				</span>
				<button
					class="btn btn-ghost"
					disabled={game.draft.rerollsLeft === 0}
					onclick={() => game.reroll()}
				>
					🎲 Re-sortear time ({game.draft.rerollsLeft} restante{game.draft.rerollsLeft === 1 ? '' : 's'})
				</button>
			</div><!-- /offer-footer -->
		</div><!-- /offer -->

		{#if game.draft.picks.length > 0}
			<div class="picks">
				<TeamCard title="Seu time até agora" subtitle="{game.draft.picks.length}/5">
					{#each sortedPicks as p (p.nick)}
						<PlayerCard player={p} majorId={p.majorId} hideRating={hideRatings} hideRoles={blind} />
					{/each}
					{#each Array(5 - game.draft.picks.length) as _, i (i)}
						<div class="empty-tile">
							<span class="empty-portrait" aria-hidden="true">?</span>
						</div>
					{/each}
				</TeamCard>
				{#if !blind}
					<ModifierList picks={game.draft.picks} />
				{/if}
			</div>
		{/if}
	</section>
{:else if game.phase === 'review' && game.draft}
	<section>
		<p class="tag">Escalação final</p>
		<h2>Monte o seu time</h2>
		{#if !blind}
			<div class="strength-bar">
				<span class="strength-label">Força do time</span>
				<span class="strength-value">{game.userStrength.toFixed(3)}</span>
			</div>
		{/if}
		<RoleBoard
			picks={game.draft.picks}
			onMove={(nick, role) => game.setSlot(nick, role)}
			hideRating={blind}
			hideRoles={blind}
			showUnassignedTray={blind}
		/>
		{#if !blind}
			<ModifierList picks={game.draft.picks} />
		{/if}
		<button class="btn big" disabled={!allAssigned} onclick={() => game.confirm()}>🏆 Disputar o Major</button>
		{#if blind && !allAssigned}
			<p class="assign-hint muted">Arraste todos os jogadores para uma função para continuar.</p>
		{/if}
	</section>
{:else if (game.phase === 'tournament' || game.phase === 'result') && game.tournament}
	<section>
		<p class="tag">Campanha</p>
		<h2>O Major</h2>

		{#if liveStageIndex !== null && liveProps}
			{#key liveStageIndex}
				{#if vetoMaps === null}
					<MapVeto
						bestOf={liveBestOf}
						opponentName={liveProps.opp.name}
						rngSeed={vetoSeed}
						mapHistory={{
							user: game.userMapHistory,
							opponent: game.getOpponentHistory(liveProps.oppLogoKey, liveStageIndex ?? 0)
						}}
						almanac={blind}
						onDone={(maps) => { vetoMaps = maps; }}
					/>
				{:else}
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
						maps={vetoMaps}
						onDone={finishLive}
					/>
				{/if}
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
				{#if game.draft}
					<FinalRoster picks={game.draft.picks} majors={game.majors} />
				{/if}
				<button class="btn" onclick={copyShare}>
					{copied ? '✓ Copiado!' : '📋 Copiar resultado'}
				</button>
				<SupportBlock />
				<AdSlot />
			</div>
			<div class="again">
				<button class="btn btn-ghost" onclick={() => playAgain('classic')}>Jogar de novo — Clássico</button>
				<button class="btn btn-ghost" onclick={() => playAgain('almanac')}>Jogar de novo — Às cegas</button>
				{#if game.hardUnlocked}
					<button class="btn btn-ghost" onclick={() => playAgain('hard')}>Jogar de novo — Difícil</button>
				{/if}
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

	.load-error {
		padding-top: 2.5rem;
		text-align: center;
	}

	.load-error .btn {
		margin-top: 1rem;
	}

	.persist-warn {
		margin: 0.85rem 0 0;
		padding: 0.6rem 0.8rem;
		font-size: 0.82rem;
		color: var(--text);
		background: rgba(216, 124, 42, 0.12);
		border-left: 3px solid var(--accent);
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

	/* ===== Tooltip de dica no draft ===== */
	.offer-footer {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.hint-tip {
		position: relative;
		display: inline-flex;
		flex-shrink: 0;
	}

	.hint-btn {
		display: grid;
		place-items: center;
		width: 1.7rem;
		height: 1.7rem;
		border: 1px solid var(--border-strong);
		background: var(--panel-2);
		color: var(--muted);
		font-family: var(--font-display);
		font-size: 0.85rem;
		font-weight: 700;
		cursor: help;
		clip-path: polygon(var(--cut-sm) 0, 100% 0, 100% calc(100% - var(--cut-sm)), calc(100% - var(--cut-sm)) 100%, 0 100%, 0 var(--cut-sm));
		transition: color 0.12s, border-color 0.12s;
	}

	.hint-btn:hover,
	.hint-btn.active {
		color: var(--accent-bright);
		border-color: var(--accent-dark);
	}

	.tip-text {
		position: absolute;
		top: calc(100% + 6px);
		left: 0;
		width: 22rem;
		max-width: calc(100vw - 2.4rem);
		background: var(--panel-3);
		border: 1px solid var(--border-strong);
		border-top: 2px solid var(--accent);
		padding: 0.65rem 0.8rem;
		font-size: 0.8rem;
		color: var(--muted);
		line-height: 1.45;
		z-index: 50;
	}

	/* ===== Barra de força na revisão ===== */
	.strength-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.55rem 0.9rem;
		margin-bottom: 0.75rem;
		background: var(--panel-2);
		border-top: 2px solid var(--accent-dark);
		box-shadow: inset 0 0 0 1px var(--border);
	}

	.strength-label {
		font-family: var(--font-display);
		font-size: 0.78rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--muted);
	}

	.strength-value {
		font-family: var(--font-display);
		font-size: 1.6rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: var(--accent-bright);
		text-shadow: 0 0 14px rgba(246, 168, 33, 0.4);
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

	.assign-hint {
		font-size: 0.8rem;
		text-align: center;
		margin: 0.4rem 0 0;
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
