<script lang="ts">
	import { ROLE_LABELS, type Player } from '$lib/data/types';
	import type { Snippet } from 'svelte';

	let {
		player,
		hideRating = false,
		highlight = false,
		onclick,
		footer
	}: {
		player: Player;
		hideRating?: boolean;
		highlight?: boolean;
		onclick?: () => void;
		footer?: Snippet;
	} = $props();
</script>

<div class="tile" class:highlight>
	<button class="portrait-button" onclick={onclick} disabled={!onclick}>
		<span class="portrait" aria-hidden="true">
			<!-- Placeholder de retrato — será substituído pelas fotos dos jogadores. -->
			<svg viewBox="0 0 64 64" fill="currentColor">
				<circle cx="32" cy="24" r="11" />
				<path d="M10 60c2-14 10-21 22-21s20 7 22 21z" />
			</svg>
		</span>
		<span class="nick">{player.nick}</span>
	</button>
	<div class="meta">
		<span class="badge badge-{player.role}">{ROLE_LABELS[player.role]}</span>
		{#if player.role2}
			<span class="badge badge-{player.role2}">{ROLE_LABELS[player.role2]}</span>
		{/if}
		{#if !hideRating}
			<span class="rating">{player.rating.toFixed(2)}</span>
		{/if}
	</div>
	{#if footer}
		<div class="footer">{@render footer()}</div>
	{/if}
</div>

<style>
	.tile {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		min-width: 0;
	}

	.portrait-button {
		display: flex;
		flex-direction: column;
		padding: 0;
		background: var(--panel-2);
		border: 1px solid var(--border);
		border-radius: 8px;
		overflow: hidden;
		color: var(--text);
		width: 100%;
	}

	.portrait-button:disabled {
		cursor: default;
	}

	.tile.highlight .portrait-button {
		border-color: var(--accent);
	}

	.portrait-button:not(:disabled):hover {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--panel-2) 80%, var(--accent) 20%);
	}

	.portrait {
		display: block;
		width: 100%;
		aspect-ratio: 4 / 5;
		background: linear-gradient(180deg, #232d3b 0%, #1a212c 100%);
		color: #3b4757;
	}

	.portrait svg {
		width: 100%;
		height: 100%;
		display: block;
	}

	.nick {
		display: block;
		width: 100%;
		padding: 0.3rem 0.2rem;
		background: rgba(0, 0, 0, 0.35);
		border-top: 1px solid var(--border);
		font-size: 0.78rem;
		font-weight: 700;
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.meta {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
	}

	.meta .badge {
		font-size: 0.62rem;
		padding: 0.08rem 0.4rem;
	}

	.rating {
		font-variant-numeric: tabular-nums;
		font-weight: 700;
		font-size: 0.8rem;
		color: var(--accent);
	}

	.footer {
		display: flex;
		justify-content: center;
	}
</style>
