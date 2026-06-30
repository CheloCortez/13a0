<script lang="ts">
	import { base } from '$app/paths';
	import PlayerCard from './PlayerCard.svelte';
	import { ROLE_LABELS, type DraftedPlayer, type Major } from '$lib/data/types';
	import { teamLogoFor, majorYear } from '$lib/data/teamBadge';

	let { picks, majors }: { picks: DraftedPlayer[]; majors: Major[] } = $props();

	// Ordem fixa de funções para o pôster ficar consistente em todos os finais.
	const ORDER = ['awp', 'igl', 'entry', 'lurker', 'support'] as const;
	const lineup = $derived(
		[...picks].sort((a, b) => ORDER.indexOf(a.slot ?? a.role) - ORDER.indexOf(b.slot ?? b.role))
	);

	function badge(pick: DraftedPlayer) {
		return {
			slot: pick.slot ?? pick.role,
			logo: teamLogoFor(majors, pick),
			team: pick.teamName,
			year: majorYear(majors, pick.majorId)
		};
	}
</script>

<div class="roster">
	<p class="roster-tag">Seu elenco dos sonhos</p>
	<div class="grid">
		{#each lineup as pick (pick.nick + pick.majorId)}
			{@const b = badge(pick)}
			<div class="card">
				<PlayerCard player={pick} majorId={pick.majorId} hideRating hideRoles>
					{#snippet footer()}
						<div class="team-badge">
							<span class="badge slot badge-{b.slot}">{ROLE_LABELS[b.slot]}</span>
							<span class="origin">
								{#if b.logo}
									<img class="logo" src="{base}/teamlogos/{b.logo}" alt="" loading="lazy" />
								{/if}
								<span class="team-text">
									<span class="team-name">{b.team}</span>
									{#if b.year}<span class="team-year">{b.year}</span>{/if}
								</span>
							</span>
						</div>
					{/snippet}
				</PlayerCard>
			</div>
		{/each}
	</div>
</div>

<style>
	.roster {
		margin: 1.4rem 0 0.4rem;
	}

	.roster-tag {
		margin: 0 0 0.7rem;
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 0.8rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--muted);
		text-align: center;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 0.6rem;
	}

	.card {
		min-width: 0;
	}

	.team-badge {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3rem;
		width: 100%;
		margin-top: 0.1rem;
	}

	.slot {
		font-size: 0.62rem;
	}

	.origin {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		min-width: 0;
		max-width: 100%;
	}

	.logo {
		width: 18px;
		height: 18px;
		object-fit: contain;
		flex-shrink: 0;
	}

	.team-text {
		display: flex;
		flex-direction: column;
		line-height: 1.1;
		min-width: 0;
	}

	.team-name {
		font-size: 0.66rem;
		font-weight: 600;
		color: var(--text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.team-year {
		font-family: var(--font-display);
		font-variant-numeric: tabular-nums;
		font-size: 0.62rem;
		color: var(--muted);
	}

	/* Mobile: dois por linha (o 5º quebra sozinho, centralizado). */
	@media (max-width: 560px) {
		.grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 0.55rem;
		}
	}
</style>
