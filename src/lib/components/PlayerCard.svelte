<script lang="ts">
	import { ROLE_LABELS, type Player } from '$lib/data/types';

	let {
		player,
		hideRating = false,
		highlight = false,
		onclick
	}: {
		player: Player;
		hideRating?: boolean;
		highlight?: boolean;
		onclick?: () => void;
	} = $props();
</script>

<button class="card" class:highlight onclick={onclick} disabled={!onclick}>
	<span class="nick">{player.nick}</span>
	<span class="meta">
		<span class="badge badge-{player.role}">{ROLE_LABELS[player.role]}</span>
		{#if player.role2}
			<span class="badge badge-{player.role2}">{ROLE_LABELS[player.role2]}</span>
		{/if}
		{#if !hideRating}
			<span class="rating">{player.rating.toFixed(2)}</span>
		{/if}
	</span>
</button>

<style>
	.card {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
		padding: 0.7rem 0.9rem;
		background: var(--panel-2);
		border: 1px solid var(--border);
		border-radius: 10px;
		color: var(--text);
		text-align: left;
	}

	.card:not(:disabled):hover {
		border-color: var(--accent);
	}

	.card:disabled {
		cursor: default;
	}

	.highlight {
		border-color: var(--accent);
	}

	.nick {
		font-weight: 700;
		font-size: 1.05rem;
	}

	.meta {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.rating {
		font-variant-numeric: tabular-nums;
		font-weight: 700;
		color: var(--accent);
		min-width: 2.6rem;
		text-align: right;
	}
</style>
