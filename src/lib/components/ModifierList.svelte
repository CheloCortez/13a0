<script lang="ts">
	import { ROLE_LABELS, type DraftedPlayer } from '$lib/data/types';
	import { teamModifiers, type TeamModifier } from '$lib/engine/strength';

	let { picks }: { picks: DraftedPlayer[] } = $props();

	const mods = $derived(teamModifiers(picks));

	function fmt(pct: number): string {
		const abs = Math.abs(pct)
			.toFixed(1)
			.replace(/\.0$/, '')
			.replace('.', ',');
		return `${pct > 0 ? '+' : '−'}${abs}%`;
	}

	function label(m: TeamModifier): string {
		switch (m.kind) {
			case 'awp-conflict':
				return `${m.count} jogadores na AWP — só cabe uma`;
			case 'igl-conflict':
				return `${m.count} jogadores de IGL — só cabe um`;
			case 'frag-conflict':
				return `${m.count} jogadores de ${ROLE_LABELS[m.role]} — função lotada`;
			case 'same-team':
				return `Sinergia: ${m.count} jogadores da ${m.team}`;
		}
	}
</script>

{#if mods.length > 0}
	<div class="mods">
		<h4>Modificadores</h4>
		{#each mods as m, i (i)}
			<p class="row" class:bonus={m.pct > 0}>
				<span class="marker" aria-hidden="true">{m.pct > 0 ? '▲' : '▼'}</span>
				<span class="label">{label(m)}</span>
				<span class="pct">{fmt(m.pct)} <em>na força</em></span>
			</p>
		{/each}
	</div>
{/if}

<style>
	.mods {
		background: linear-gradient(180deg, var(--panel), var(--bg-raise));
		border: 1px solid var(--border);
		border-top: none;
		padding: 0.55rem 0.8rem 0.6rem;
	}

	h4 {
		margin: 0 0 0.35rem;
		font-size: 0.72rem;
		color: var(--muted);
		letter-spacing: 0.14em;
	}

	.row {
		display: flex;
		align-items: baseline;
		gap: 0.45rem;
		margin: 0.18rem 0;
		font-size: 0.84rem;
	}

	.marker {
		font-size: 0.6rem;
		color: var(--loss);
		flex-shrink: 0;
	}

	.row.bonus .marker {
		color: var(--win);
	}

	.label {
		min-width: 0;
	}

	.pct {
		margin-left: auto;
		font-family: var(--font-display);
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
		color: var(--loss);
	}

	.row.bonus .pct {
		color: var(--win);
	}

	.pct em {
		font-style: normal;
		font-family: var(--font-body);
		font-weight: 400;
		font-size: 0.72rem;
		color: var(--muted);
	}
</style>
