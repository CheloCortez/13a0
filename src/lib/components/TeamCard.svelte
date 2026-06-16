<script lang="ts">
	import { base } from '$app/paths';
	import { teamLogos } from '$lib/data/teamLogos';
	import type { Snippet } from 'svelte';

	let {
		title,
		subtitle,
		right,
		teamKey,
		children
	}: {
		title: string;
		subtitle?: string;
		right?: string;
		/** Chave `${majorId}/${teamId}` para exibir a logo da época no cabeçalho. */
		teamKey?: string;
		children: Snippet;
	} = $props();

	const logo = $derived(teamKey ? teamLogos[teamKey] : undefined);
	let broken = $state(false);
	$effect(() => {
		logo;
		broken = false;
	});
</script>

<div class="team-card">
	<header>
		{#if logo && !broken}
			<img class="crest" src="{base}/teamlogos/{logo}" alt="" loading="lazy" onerror={() => (broken = true)} />
		{/if}
		<span class="title">
			<strong>{title}</strong>
			{#if subtitle}<span class="sub">{subtitle}</span>{/if}
		</span>
		{#if right}<span class="right">{right}</span>{/if}
	</header>
	<div class="row">
		{@render children()}
	</div>
</div>

<style>
	.team-card {
		background: linear-gradient(180deg, var(--panel-2), var(--panel));
		border: 1px solid var(--border);
		overflow: hidden;
		box-shadow: 0 10px 24px -18px rgba(0, 0, 0, 0.9);
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.6rem;
		padding: 0.55rem 0.9rem;
		background: linear-gradient(90deg, var(--panel-3), var(--panel-2));
		border-bottom: 1px solid var(--border);
		border-left: 3px solid var(--accent);
	}

	.crest {
		width: 1.6rem;
		height: 1.6rem;
		object-fit: contain;
		flex-shrink: 0;
	}

	.title {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		min-width: 0;
	}

	.title strong {
		font-family: var(--font-display);
		font-size: 1.05rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.sub {
		color: var(--muted);
		font-size: 0.78rem;
		white-space: nowrap;
	}

	.right {
		font-family: var(--font-display);
		font-weight: 600;
		color: var(--muted);
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		white-space: nowrap;
	}

	.row {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: clamp(0.3rem, 1.5vw, 0.55rem);
		padding: clamp(0.45rem, 2vw, 0.7rem);
	}
</style>
