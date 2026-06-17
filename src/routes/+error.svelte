<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';

	const is404 = $derived(page.status === 404);
	const title = $derived(is404 ? 'Página não encontrada' : 'Algo deu errado');
	const detail = $derived(
		is404
			? 'O endereço que você tentou abrir não existe. Que tal voltar e montar seu time?'
			: (page.error?.message ?? 'Tente recarregar a página em alguns instantes.')
	);
</script>

<svelte:head>
	<title>13 a 0 — {title}</title>
</svelte:head>

<section class="err">
	<p class="code">{page.status}</p>
	<h1>{title}</h1>
	<p class="detail">{detail}</p>
	<div class="actions">
		<a class="btn" href="{base}/">Voltar ao início</a>
		<a class="btn btn-ghost" href="{base}/jogo?novo=classic">Jogar agora</a>
	</div>
</section>

<style>
	.err {
		max-width: 30rem;
		margin: 3rem auto 0;
		text-align: center;
		padding: 0 1rem;
	}

	.code {
		font-family: var(--font-display);
		font-size: 4.5rem;
		font-weight: 700;
		line-height: 1;
		color: var(--accent);
		margin: 0;
	}

	h1 {
		margin: 0.4rem 0 0.6rem;
		font-size: 1.5rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.detail {
		color: var(--muted);
		margin: 0 0 1.4rem;
	}

	.actions {
		display: flex;
		gap: 0.6rem;
		justify-content: center;
		flex-wrap: wrap;
	}
</style>
