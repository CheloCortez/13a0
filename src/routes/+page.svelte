<script lang="ts">
	import { base } from '$app/paths';
	import Seo from '$lib/components/Seo.svelte';
	import { game } from '$lib/stores/game.svelte';

	const hasSave = game.hasSavedGame;

	let mode = $state<'classic' | 'almanac'>('classic');

	const settings = $derived(
		mode === 'classic'
			? ['Competitivo', 'Draft de 5', 'Ratings visíveis', '3 re-sorteios']
			: ['Almanaque', 'Draft de 5', 'Às cegas', '1 re-sorteio']
	);
	const blurb = $derived(
		mode === 'classic'
			? 'Ratings à mostra — monte o melhor time no papel.'
			: 'Tudo oculto: ratings, funções e força. Vale o seu conhecimento da cena.'
	);
</script>

<Seo
	title="13 a 0 — monte o time dos sonhos do Counter-Strike"
	description="Sorteie times históricos de todos os Majors de CS, monte seu time dos sonhos e tente vencer um mapa por 13 a 0."
	path="/"
/>

<section class="hero">
	<p class="tag rise" style="--i: 0">O placar perfeito</p>

	<h1 class="scoreboard rise" style="--i: 1" aria-label="13 a 0">
		<span class="score t">13</span>
		<span class="sep" aria-hidden="true">:</span>
		<span class="score ct">0</span>
	</h1>

	<p class="tagline rise" style="--i: 2">
		Sorteie elencos históricos dos Majors de Counter-Strike, escale o time dos sonhos pick a pick —
		até com 5 AWPers, se tiver coragem — e dispute um Major inteiro.
	</p>

	{#if hasSave}
		<div class="resume rise" style="--i: 3">
			<a class="btn big" href="{base}/jogo">▶ Continuar campanha</a>
		</div>
	{/if}

	<!-- "Partida encontrada" estilo CS2 -->
	<div class="found rise" style="--i: 4">
		<p class="found-title"><span class="pip" aria-hidden="true"></span> Sua partida está pronta!</p>

		<div class="toggle" role="group" aria-label="Modo de jogo">
			<button class="pill classic" class:active={mode === 'classic'} onclick={() => (mode = 'classic')}>
				Clássico
			</button>
			<button class="pill almanac" class:active={mode === 'almanac'} onclick={() => (mode = 'almanac')}>
				Almanaque
			</button>
		</div>

		<p class="settings">
			{#each settings as s, i (s)}{#if i > 0}<span class="dot" aria-hidden="true">•</span>{/if}<span>{s}</span>{/each}
		</p>

		<a class="accept" href="{base}/jogo?novo={mode}">Aceitar</a>

		<p class="blurb">{blurb}</p>
	</div>

	<a class="how rise" style="--i: 5" href="{base}/sobre">Como jogar →</a>
</section>

<style>
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

	/* ===== Toggle de modo ===== */
	.toggle {
		display: inline-flex;
		margin-bottom: 0.7rem;
		box-shadow: inset 0 0 0 1px var(--border-strong);
		clip-path: polygon(var(--cut-sm) 0, 100% 0, 100% calc(100% - var(--cut-sm)), calc(100% - var(--cut-sm)) 100%, 0 100%, 0 var(--cut-sm));
	}

	.pill {
		padding: 0.45rem 1.1rem;
		background: var(--panel-2);
		color: var(--muted);
		font-family: var(--font-display);
		font-size: 0.85rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		transition: color 0.15s, background 0.15s;
	}

	.pill.active.classic {
		background: linear-gradient(180deg, var(--accent-bright), var(--accent));
		color: #1a1206;
	}

	.pill.active.almanac {
		background: linear-gradient(180deg, #8fc4f4, var(--ct));
		color: #08121d;
	}

	.pill:not(.active):hover {
		color: var(--text);
	}

	.settings {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		margin: 0 0 1.1rem;
		font-family: var(--font-display);
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.settings .dot {
		color: color-mix(in srgb, var(--green) 70%, var(--muted));
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

	.blurb {
		margin: 0.9rem auto 0;
		max-width: 24rem;
		font-size: 0.84rem;
		color: var(--muted);
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
