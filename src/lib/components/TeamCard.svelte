<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		subtitle,
		right,
		children
	}: {
		title: string;
		subtitle?: string;
		right?: string;
		children: Snippet;
	} = $props();
</script>

<div class="team-card">
	<header>
		<span class="title">
			<strong>{title}</strong>
			{#if subtitle}<span class="sub">({subtitle})</span>{/if}
		</span>
		{#if right}<span class="right">{right}</span>{/if}
	</header>
	<div class="row">
		{@render children()}
	</div>
</div>

<style>
	.team-card {
		background: var(--panel);
		border: 1px solid var(--border);
		border-radius: 10px;
		overflow: hidden;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.6rem;
		padding: 0.6rem 0.9rem;
		background: var(--panel-2);
		border-bottom: 1px solid var(--border);
	}

	.title strong {
		font-size: 1.02rem;
	}

	.sub {
		color: var(--muted);
		font-size: 0.82rem;
		margin-left: 0.4rem;
	}

	.right {
		color: var(--muted);
		font-size: 0.8rem;
		white-space: nowrap;
	}

	.row {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 0.45rem;
		padding: 0.6rem;
	}
</style>
