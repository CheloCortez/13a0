<script lang="ts">
	import { base } from '$app/paths';
	import { teamLogos } from '$lib/data/teamLogos';

	let {
		stageLabel,
		oppName,
		oppLogoKey,
		actionLabel,
		onSimulate
	}: {
		stageLabel: string;
		oppName: string;
		/** Chave `${majorId}/${teamId}` da logo do adversário. */
		oppLogoKey: string;
		actionLabel: string;
		onSimulate: () => void;
	} = $props();

	const oppLogo = $derived(teamLogos[oppLogoKey]);
</script>

<div class="matchup">
	<p class="stage-tag">{stageLabel}</p>
	<div class="vs">
		<div class="side">
			<span class="crest user" aria-hidden="true">★</span>
			<span class="tname user">Seu Time</span>
		</div>
		<span class="x" aria-hidden="true">VS</span>
		<div class="side opp">
			{#if oppLogo}
				<img class="crest" src="{base}/teamlogos/{oppLogo}" alt="" />
			{:else}
				<span class="crest" aria-hidden="true">●</span>
			{/if}
			<span class="tname">{oppName}</span>
		</div>
	</div>
	<button class="btn big" onclick={onSimulate}>▶ {actionLabel}</button>
</div>

<style>
	.matchup {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
		margin-top: 1.2rem;
	}

	.stage-tag {
		margin: 0;
		text-align: center;
		font-family: var(--font-display);
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--accent);
	}

	.vs {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: 0.8rem;
		padding: 1.2rem 1rem;
		background:
			radial-gradient(26rem 11rem at 50% -3rem, rgba(246, 168, 33, 0.1), transparent 70%),
			linear-gradient(180deg, var(--panel-2), var(--panel));
		border: 1px solid var(--border);
		border-top: 2px solid var(--border-strong);
	}

	.side {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		min-width: 0;
	}

	.crest {
		width: 3.2rem;
		height: 3.2rem;
		object-fit: contain;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 1.7rem;
	}

	.crest.user {
		color: var(--accent);
	}

	.tname {
		font-family: var(--font-display);
		font-size: 0.95rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.02em;
		text-align: center;
		line-height: 1.1;
	}

	.tname.user {
		color: var(--accent-bright);
	}

	.x {
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--muted);
		letter-spacing: 0.1em;
	}

	.big {
		width: 100%;
		padding: 0.95rem;
		font-size: 1.08rem;
	}
</style>
