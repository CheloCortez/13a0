<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { base } from '$app/paths';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<header>
	<nav>
		<a class="logo" href="{base}/">13<span>A</span>0</a>
		<a href="{base}/sobre">como jogar</a>
	</nav>
</header>

<main>
	{@render children()}
</main>

<style>
	header {
		border-bottom: 1px solid var(--border);
		background: var(--panel);
	}

	nav {
		max-width: 640px;
		margin: 0 auto;
		padding: 0.7rem 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.logo {
		font-size: 1.3rem;
		font-weight: 900;
		letter-spacing: -0.03em;
		color: var(--text);
		text-decoration: none;
	}

	.logo span {
		color: var(--accent);
	}

	nav a:not(.logo) {
		color: var(--muted);
		text-decoration: none;
		font-size: 0.9rem;
	}

	nav a:not(.logo):hover {
		color: var(--text);
	}
</style>
