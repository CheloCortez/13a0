<script lang="ts">
	import { base } from '$app/paths';
	import { browser } from '$app/environment';

	const hasSave = browser && localStorage.getItem('13a0:campanha') !== null;
</script>

<svelte:head>
	<title>13 a 0 — monte o time dos sonhos do Counter-Strike</title>
	<meta
		name="description"
		content="Sorteie times históricos de todos os Majors de CS, monte seu time dos sonhos e tente vencer um mapa por 13 a 0."
	/>
</svelte:head>

<section class="hero">
	<h1>13<span>A</span>0</h1>
	<p class="tagline">
		Sorteie elencos históricos dos Majors de Counter-Strike, escale um time dos sonhos função por
		função e simule um Major inteiro. Consegue o mapa perfeito?
	</p>

	<div class="actions">
		{#if hasSave}
			<a class="btn" href="{base}/jogo">Continuar campanha</a>
			<a class="btn btn-ghost" href="{base}/jogo?novo=classic">Novo jogo — Clássico</a>
			<a class="btn btn-ghost" href="{base}/jogo?novo=almanac">Novo jogo — Almanaque</a>
		{:else}
			<a class="btn" href="{base}/jogo?novo=classic">Jogar — modo Clássico</a>
			<a class="btn btn-ghost" href="{base}/jogo?novo=almanac">Jogar — modo Almanaque</a>
		{/if}
	</div>

	<div class="modes panel">
		<p><strong>Clássico</strong> — ratings visíveis e 3 re-sorteios.</p>
		<p><strong>Almanaque</strong> — ratings ocultos e só 1 re-sorteio: confie no seu conhecimento da cena.</p>
	</div>
</section>

<style>
	.hero {
		text-align: center;
		padding-top: 2.5rem;
	}

	h1 {
		font-size: 4rem;
		margin: 0;
	}

	h1 span {
		color: var(--accent);
	}

	.tagline {
		color: var(--muted);
		max-width: 26rem;
		margin: 0.8rem auto 2rem;
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
		max-width: 20rem;
		margin: 0 auto 2rem;
	}

	.modes {
		text-align: left;
		font-size: 0.9rem;
	}

	.modes p {
		margin: 0.3rem 0;
	}
</style>
