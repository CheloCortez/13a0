<script lang="ts">
	import { base } from '$app/paths';
	import { ROLE_LABELS, type Player } from '$lib/data/types';
	import { playerImages } from '$lib/data/playerImages';
	import type { Snippet } from 'svelte';

	let {
		player,
		majorId,
		hideRating = false,
		hideRoles = false,
		highlight = false,
		onclick,
		footer
	}: {
		player: Player;
		/** Major de origem: escolhe a foto da época/camisa certa do jogador. */
		majorId?: string;
		hideRating?: boolean;
		/** Modo almanaque: esconde as funções naturais do jogador. */
		hideRoles?: boolean;
		highlight?: boolean;
		onclick?: () => void;
		footer?: Snippet;
	} = $props();

	// Foto da época (byMajor) com fallback para a foto mais recente (byNick);
	// cai na silhueta se não houver nenhuma ou se a imagem falhar ao carregar.
	const nickKey = $derived(player.nick.toLowerCase());
	const photo = $derived(
		(majorId ? playerImages.byMajor[`${majorId}/${nickKey}`] : undefined) ??
			playerImages.byNick[nickKey]
	);
	let broken = $state(false);
	// Reseta o estado de erro quando a foto muda (componente reaproveitado).
	$effect(() => {
		photo;
		broken = false;
	});
</script>

<div class="tile" class:highlight>
	<button class="portrait-button" onclick={onclick} disabled={!onclick}>
		<span class="portrait" aria-hidden="true">
			{#if photo && !broken}
				<img
					class="photo"
					src="{base}/players/{photo}"
					alt=""
					loading="lazy"
					onerror={() => (broken = true)}
				/>
			{:else}
				<svg viewBox="0 0 64 64" fill="currentColor">
					<circle cx="32" cy="24" r="11" />
					<path d="M10 60c2-14 10-21 22-21s20 7 22 21z" />
				</svg>
			{/if}
		</span>
		<span class="nick">{player.nick}</span>
	</button>
	{#if !hideRoles || !hideRating}
		<div class="meta">
			{#if !hideRoles}
				<span class="badge badge-{player.role}">{ROLE_LABELS[player.role]}</span>
				{#if player.role2}
					<span class="badge badge-{player.role2}">{ROLE_LABELS[player.role2]}</span>
				{/if}
			{/if}
			{#if !hideRating}
				<span class="rating">{player.rating.toFixed(2)}</span>
			{/if}
		</div>
	{/if}
	{#if footer}
		<div class="footer">{@render footer()}</div>
	{/if}
</div>

<style>
	.tile {
		display: flex;
		flex-direction: column;
		gap: 0.32rem;
		min-width: 0;
	}

	.portrait-button {
		display: flex;
		flex-direction: column;
		padding: 0;
		background: var(--panel-2);
		box-shadow: inset 0 0 0 1px var(--border);
		overflow: hidden;
		color: var(--text);
		width: 100%;
		clip-path: polygon(
			var(--cut-sm) 0,
			100% 0,
			100% calc(100% - var(--cut-sm)),
			calc(100% - var(--cut-sm)) 100%,
			0 100%,
			0 var(--cut-sm)
		);
		transition: box-shadow 0.15s, transform 0.15s;
	}

	.portrait-button:disabled {
		cursor: default;
	}

	.tile.highlight .portrait-button {
		box-shadow:
			inset 0 0 0 1px var(--accent),
			inset 0 -14px 22px -16px color-mix(in srgb, var(--accent) 70%, transparent);
	}

	.portrait-button:not(:disabled):hover {
		box-shadow:
			inset 0 0 0 1px var(--accent-bright),
			inset 0 -18px 26px -14px color-mix(in srgb, var(--accent) 85%, transparent);
		transform: translateY(-2px);
	}

	.portrait {
		display: block;
		width: 100%;
		aspect-ratio: 4 / 5;
		background:
			linear-gradient(160deg, #283444 0%, #1a212c 70%),
			var(--panel-2);
		color: #3e4c5f;
		position: relative;
	}

	.portrait::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, transparent 55%, rgba(0, 0, 0, 0.45));
	}

	.portrait svg {
		width: 100%;
		height: 100%;
		display: block;
	}

	.photo {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: top center;
		display: block;
	}

	.nick {
		display: block;
		width: 100%;
		padding: 0.32rem 0.2rem 0.26rem;
		background: rgba(0, 0, 0, 0.4);
		border-top: 1px solid var(--border);
		font-family: var(--font-display);
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0.03em;
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.tile.highlight .nick {
		color: var(--accent-bright);
	}

	.meta {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.22rem;
	}

	.meta .badge {
		font-size: 0.62rem;
		padding: 0.08rem 0.4rem;
	}

	.rating {
		font-family: var(--font-display);
		font-variant-numeric: tabular-nums;
		font-weight: 700;
		font-size: 0.85rem;
		color: var(--accent);
	}

	.footer {
		display: flex;
		justify-content: center;
	}

	@media (prefers-reduced-motion: reduce) {
		.portrait-button:not(:disabled):hover {
			transform: none;
		}
	}
</style>
