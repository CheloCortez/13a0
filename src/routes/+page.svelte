<script lang="ts">
	import { base } from '$app/paths';
	import Seo from '$lib/components/Seo.svelte';
	import { game } from '$lib/stores/game.svelte';

	const hasSave = game.hasSavedGame;
	const hardUnlocked = game.hardUnlocked;

	type Mode = 'classic' | 'almanac' | 'hard';
	let mode = $state<Mode>('classic');

	const MODES: { id: Mode; label: string }[] = [
		{ id: 'classic', label: 'Clássico' },
		{ id: 'almanac', label: 'Almanaque' },
		{ id: 'hard', label: 'Difícil' }
	];

	const SETTINGS: Record<Mode, string[]> = {
		classic: ['Ratings visíveis', 'Draft de 5', '3 re-sorteios'],
		almanac: ['Às cegas', 'Draft de 5', '1 re-sorteio'],
		hard: ['Só campeões', 'Às cegas', '1 re-sorteio']
	};
	const BLURBS: Record<Mode, string> = {
		classic: 'Ratings à mostra — monte o melhor time no papel.',
		almanac: 'Tudo oculto: ratings, funções e força. Vale o seu conhecimento da cena.',
		hard: 'Só campeões de Major no draft e como adversários, e tudo às cegas. O teste final.'
	};

	function select(id: Mode) {
		if (id === 'hard' && !hardUnlocked) return;
		mode = id;
	}
</script>

<Seo
	title="13 a 0 — monte o time dos sonhos do Counter-Strike"
	description="Sorteie times históricos de todos os Majors de CS, monte seu time dos sonhos e tente vencer um mapa por 13 a 0."
	path="/"
/>

<section class="hero">
	<div class="cs2-bg" aria-hidden="true">
		<div class="cs-slash s1"></div>
		<div class="cs-slash s2"></div>
		<div class="cs-lines l1"></div>
		<div class="cs-slash s3"></div>
		<div class="cs-lines l2"></div>
	</div>

	<div class="hero-inner">
	<p class="tag rise" style="--i: 0">O placar perfeito</p>

	<h1 class="scoreboard rise" style="--i: 1" aria-label="13 a 0">
		<span class="score t">13</span>
		<span class="sep" aria-hidden="true">:</span>
		<span class="score ct">0</span>
	</h1>

	<p class="tagline rise" style="--i: 2">
		Escale o time dos sonhos e dispute o maior Major de todos os tempos.
	</p>

	{#if hasSave}
		<div class="resume rise" style="--i: 3">
			<a class="btn big" href="{base}/jogo">▶ Continuar campanha</a>
		</div>
	{/if}

	<!-- "Partida encontrada" estilo CS2 -->
	<div class="found rise" style="--i: 4">
		<p class="found-title"><span class="pip" aria-hidden="true"></span> Sua partida está pronta!</p>

		<a class="accept" href="{base}/jogo?novo={mode}">Novo jogo</a>
	</div>

	<div class="modes rise" role="radiogroup" aria-label="Modo de jogo" style="--i: 5">
		{#each MODES as m (m.id)}
				{@const locked = m.id === 'hard' && !hardUnlocked}
				<button
					type="button"
					class="mode {m.id}"
					class:active={mode === m.id}
					class:locked
					role="radio"
					aria-checked={mode === m.id}
					disabled={locked}
					title={locked ? 'Vença um Major no Clássico ou Almanaque para desbloquear' : undefined}
					onclick={() => select(m.id)}
				>
					<span class="mode-name">
						{#if locked}<span class="lock" aria-hidden="true">🔒</span>{/if}{m.label}
					</span>
					<span class="mode-info">
						{#each SETTINGS[m.id] as s, i (s)}{#if i > 0}<span class="dot" aria-hidden="true">•</span>{/if}<span>{s}</span>{/each}
					</span>
					<span class="mode-blurb">
						{locked ? 'Vença um Major para desbloquear.' : BLURBS[m.id]}
					</span>
				</button>
			{/each}
	</div>

	<a class="how rise" style="--i: 6" href="{base}/sobre">Como jogar →</a>
	</div><!-- /hero-inner -->
</section>

<style>
	/* ===== CS2 diagonal background ===== */
	.cs2-bg {
		position: fixed;
		inset: 0;
		z-index: 0;
		overflow: hidden;
		pointer-events: none;
	}

	.cs-slash,
	.cs-lines {
		position: absolute;
		inset: 0;
	}

	/*
	 * Inclinação: ≈70° da horizontal (shift de ~45% horizontal para 120% vertical).
	 * Cada forma: polygon(x_base 110%, x_base+w 110%, x_base+w+45% -10%, x_base+45% -10%)
	 */
	.s1 {
		background: rgba(246, 168, 33, 0.055);
		clip-path: polygon(-3% 110%, 13% 110%, 58% -10%, 42% -10%);
	}
	.s2 {
		background: rgba(246, 168, 33, 0.032);
		clip-path: polygon(15% 110%, 19% 110%, 64% -10%, 60% -10%);
	}
	.l1 {
		clip-path: polygon(21% 110%, 38% 110%, 83% -10%, 66% -10%);
		background: repeating-linear-gradient(
			-70deg,
			transparent 0,
			transparent 7px,
			rgba(246, 168, 33, 0.11) 7px,
			rgba(246, 168, 33, 0.11) 8px
		);
	}
	.s3 {
		background: rgba(246, 168, 33, 0.038);
		clip-path: polygon(40% 110%, 64% 110%, 109% -10%, 85% -10%);
	}
	.l2 {
		clip-path: polygon(66% 110%, 90% 110%, 135% -10%, 111% -10%);
		background: repeating-linear-gradient(
			-70deg,
			transparent 0,
			transparent 9px,
			rgba(246, 168, 33, 0.08) 9px,
			rgba(246, 168, 33, 0.08) 10px
		);
	}

	.hero-inner {
		position: relative;
		z-index: 1;
	}

	/* ============================= */

	.hero {
		text-align: center;
		padding-top: clamp(1.4rem, 5vw, 2.6rem);
	}

	.hero .tag {
		justify-content: center;
	}

	.tag::after {
		content: '';
		width: 1.4rem;
		height: 2px;
		background: var(--accent);
	}

	/* ===== Placar estilo scoreboard de CS ===== */
	.scoreboard {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: clamp(0.5rem, 2.5vw, 0.9rem);
		margin: 1rem 0 0;
	}

	.score {
		display: grid;
		place-items: center;
		min-width: clamp(4.8rem, 21vw, 7rem);
		padding: 0.1em 0.18em 0;
		font-size: clamp(3.2rem, 13vw, 5rem);
		font-weight: 700;
		line-height: 1.15;
		font-variant-numeric: tabular-nums;
		clip-path: polygon(var(--cut) 0, 100% 0, 100% calc(100% - var(--cut)), calc(100% - var(--cut)) 100%, 0 100%, 0 var(--cut));
	}

	.score.t {
		color: var(--accent-bright);
		background:
			linear-gradient(180deg, rgba(246, 168, 33, 0.16), rgba(246, 168, 33, 0.05)),
			var(--panel-2);
		box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 45%, transparent);
		text-shadow: 0 0 26px rgba(246, 168, 33, 0.5);
	}

	.score.ct {
		color: var(--ct);
		background:
			linear-gradient(180deg, rgba(108, 178, 240, 0.14), rgba(108, 178, 240, 0.04)),
			var(--panel-2);
		box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ct) 40%, transparent);
		text-shadow: 0 0 26px rgba(108, 178, 240, 0.45);
	}

	.sep {
		font-family: var(--font-display);
		font-size: clamp(2rem, 8vw, 3rem);
		font-weight: 700;
		color: var(--muted);
		transform: translateY(-0.06em);
	}

	.tagline {
		color: var(--muted);
		max-width: 28rem;
		margin: 1.2rem auto 1.4rem;
		font-size: 0.96rem;
	}

	.resume {
		max-width: 24rem;
		margin: 0 auto 1.2rem;
	}

	.big {
		display: block;
		padding: 0.9rem 1.5rem;
		font-size: 1.05rem;
	}

	/* ===== Card "partida encontrada" ===== */
	.found {
		--green: #7ec64a;
		max-width: 30rem;
		margin: 0 auto;
		padding: 1.3rem 1.1rem 1.4rem;
		background:
			radial-gradient(26rem 12rem at 50% -2rem, rgba(126, 198, 74, 0.16), transparent 70%),
			linear-gradient(180deg, var(--panel-2), var(--panel));
		border: 1px solid color-mix(in srgb, var(--green) 35%, var(--border));
		border-top: 2px solid var(--green);
		box-shadow: 0 14px 40px -22px rgba(0, 0, 0, 0.9);
	}

	.found-title {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin: 0 0 0.9rem;
		font-family: var(--font-display);
		font-size: clamp(1.05rem, 4.5vw, 1.4rem);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #aee87a;
		text-shadow: 0 0 18px rgba(126, 198, 74, 0.5);
	}

	.pip {
		width: 0.6rem;
		height: 0.6rem;
		border-radius: 50%;
		background: var(--green);
		box-shadow: 0 0 8px var(--green);
		animation: blink 1.4s ease-in-out infinite;
	}

	/* ===== Caixas de modo ===== */
	.modes {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		max-width: 30rem;
		margin: 1.1rem auto 0;
		text-align: left;
	}

	.mode {
		display: block;
		width: 100%;
		padding: 0.7rem 0.9rem;
		text-align: left;
		background: var(--panel-2);
		border: 1px solid var(--border);
		border-left: 3px solid var(--border-strong);
		color: var(--muted);
		cursor: pointer;
		clip-path: polygon(var(--cut-sm) 0, 100% 0, 100% calc(100% - var(--cut-sm)), calc(100% - var(--cut-sm)) 100%, 0 100%, 0 var(--cut-sm));
		transition: border-color 0.15s, background 0.15s;
	}

	.mode:not(.locked):hover {
		border-color: var(--border-strong);
	}

	.mode-name {
		display: block;
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text);
	}

	.mode-name .lock {
		font-size: 0.8rem;
		margin-right: 0.25rem;
	}

	.mode-info {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.35rem;
		margin-top: 0.3rem;
		font-family: var(--font-display);
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.mode-info .dot {
		color: color-mix(in srgb, var(--green) 70%, var(--muted));
	}

	.mode-blurb {
		display: block;
		margin-top: 0.4rem;
		font-size: 0.8rem;
		line-height: 1.4;
		color: var(--muted);
	}

	/* Modo selecionado — filete e nome na cor do modo */
	.mode.active {
		background: linear-gradient(180deg, var(--panel-3), var(--panel-2));
	}

	.mode.active.classic {
		border-color: color-mix(in srgb, var(--accent) 45%, var(--border));
		border-left-color: var(--accent);
	}
	.mode.active.classic .mode-name {
		color: var(--accent-bright);
	}

	.mode.active.almanac {
		border-color: color-mix(in srgb, var(--ct) 45%, var(--border));
		border-left-color: var(--ct);
	}
	.mode.active.almanac .mode-name {
		color: #8fc4f4;
	}

	.mode.active.hard {
		border-color: color-mix(in srgb, var(--loss) 45%, var(--border));
		border-left-color: var(--loss);
	}
	.mode.active.hard .mode-name {
		color: #ff9a90;
	}

	.mode.locked {
		opacity: 0.55;
		cursor: not-allowed;
	}
	.mode.locked .mode-name {
		color: var(--muted);
	}

	/* ===== Botão ACEITAR estilo CS2 ===== */
	.accept {
		display: block;
		width: 100%;
		max-width: 20rem;
		margin: 0 auto;
		padding: 0.95rem 1.5rem;
		font-family: var(--font-display);
		font-size: clamp(1.5rem, 6vw, 1.95rem);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		color: #fff;
		text-decoration: none;
		text-align: center;
		border-radius: 5px;
		background: linear-gradient(180deg, #8ed457 0%, #5aa630 54%, #4a8d27 100%);
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
		box-shadow:
			inset 0 2px 0 rgba(255, 255, 255, 0.35),
			inset 0 -3px 7px rgba(0, 0, 0, 0.28),
			0 0 0 2px #2f5f1c,
			0 0 0 5px rgba(126, 198, 74, 0.45),
			0 0 24px rgba(126, 198, 74, 0.5);
		animation: acceptPulse 1.9s ease-in-out infinite;
		transition: filter 0.15s, transform 0.1s;
	}

	.accept:hover {
		filter: brightness(1.09);
	}

	.accept:active {
		transform: translateY(1px);
	}

	.how {
		display: inline-block;
		margin-top: 1.4rem;
		font-family: var(--font-display);
		font-size: 0.82rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--muted);
		text-decoration: none;
		border-bottom: 2px solid transparent;
		transition: color 0.15s, border-color 0.15s;
	}

	.how:hover {
		color: var(--accent-bright);
		border-bottom-color: var(--accent);
	}

	@keyframes acceptPulse {
		0%,
		100% {
			box-shadow:
				inset 0 2px 0 rgba(255, 255, 255, 0.35),
				inset 0 -3px 7px rgba(0, 0, 0, 0.28),
				0 0 0 2px #2f5f1c,
				0 0 0 5px rgba(126, 198, 74, 0.4),
				0 0 20px rgba(126, 198, 74, 0.4);
		}
		50% {
			box-shadow:
				inset 0 2px 0 rgba(255, 255, 255, 0.35),
				inset 0 -3px 7px rgba(0, 0, 0, 0.28),
				0 0 0 2px #2f5f1c,
				0 0 0 5px rgba(126, 198, 74, 0.75),
				0 0 36px rgba(126, 198, 74, 0.85);
		}
	}

	@keyframes blink {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.35;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.accept {
			animation: none;
		}
		.pip {
			animation: none;
		}
	}
</style>
