<script lang="ts">
	import type { SwissResult, TournamentTeam } from '$lib/engine/tournament';
	import TeamChip from './TeamChip.svelte';

	let {
		swiss,
		revealed
	}: {
		swiss: SwissResult;
		/** Quantas rodadas da suíça já foram reveladas (0..5). */
		revealed: number;
	} = $props();

	interface Standing {
		team: TournamentTeam;
		wins: number;
		losses: number;
	}

	/** Registros recalculados só com as rodadas já reveladas. */
	const standings = $derived.by(() => {
		const map = new Map<string, Standing>();
		for (const m of swiss.rounds[0]?.matches ?? []) {
			map.set(m.a.id, { team: m.a, wins: 0, losses: 0 });
			map.set(m.b.id, { team: m.b, wins: 0, losses: 0 });
		}
		for (const round of swiss.rounds.slice(0, revealed)) {
			for (const m of round.matches) {
				const winner = m.series.winner === 'A' ? m.a : m.b;
				const loser = m.series.winner === 'A' ? m.b : m.a;
				map.get(winner.id)!.wins++;
				map.get(loser.id)!.losses++;
			}
		}
		return map;
	});

	const qualified = $derived(
		[...standings.values()]
			.filter((s) => s.wins === 3)
			.sort((a, b) => a.losses - b.losses)
	);
	const eliminated = $derived(
		[...standings.values()]
			.filter((s) => s.losses === 3)
			.sort((a, b) => b.wins - a.wins)
	);

	/** Confrontos da próxima rodada, agrupados por registro (estilo Pick'Em). */
	const buckets = $derived.by(() => {
		const next = swiss.rounds[revealed];
		if (!next) return [];
		const groups = new Map<string, typeof next.matches>();
		for (const m of next.matches) {
			const key = `${m.recordBefore.wins}-${m.recordBefore.losses}`;
			groups.set(key, [...(groups.get(key) ?? []), m]);
		}
		return [...groups.entries()].sort((a, b) => {
			const [wa, la] = a[0].split('-').map(Number);
			const [wb, lb] = b[0].split('-').map(Number);
			return wb - wa || la - lb;
		});
	});
</script>

<div class="board">
	{#if qualified.length > 0}
		<div class="box green">
			<h4>✅ Classificados aos playoffs</h4>
			<div class="list">
				{#each qualified as s (s.team.id)}
					<TeamChip name={s.team.name} isUser={s.team.isUser} record="{s.wins}-{s.losses}" />
				{/each}
			</div>
		</div>
	{/if}

	{#each buckets as [record, matches] (record)}
		<div class="bucket">
			<h4>{record}</h4>
			{#each matches as m (m.a.id + m.b.id)}
				<div class="pair" class:user={m.a.isUser || m.b.isUser}>
					<TeamChip name={m.a.name} isUser={m.a.isUser} />
					<span class="vs">vs</span>
					<TeamChip name={m.b.name} isUser={m.b.isUser} />
				</div>
			{/each}
		</div>
	{/each}

	{#if eliminated.length > 0}
		<div class="box red">
			<h4>❌ Eliminados</h4>
			<div class="list">
				{#each eliminated as s (s.team.id)}
					<TeamChip name={s.team.name} isUser={s.team.isUser} record="{s.wins}-{s.losses}" />
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.board {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
		margin-top: 1rem;
	}

	h4 {
		margin: 0 0 0.45rem;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.bucket {
		background: var(--panel);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 0.7rem 0.8rem;
	}

	.bucket h4 {
		color: var(--accent);
	}

	.pair {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: 0.5rem;
		padding: 0.35rem 0.4rem;
		border-radius: 8px;
	}

	.pair + .pair {
		border-top: 1px solid var(--border);
	}

	.pair.user {
		background: var(--panel-2);
	}

	.pair :global(.chip:last-of-type) {
		justify-self: end;
	}

	.vs {
		color: var(--muted);
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
	}

	.box {
		border-radius: 10px;
		padding: 0.7rem 0.8rem;
		border: 1px solid;
	}

	.box .list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
		gap: 0.45rem 0.8rem;
	}

	.box.green {
		background: color-mix(in srgb, #14532d 55%, var(--panel));
		border-color: #1d7a40;
	}

	.box.green h4 {
		color: var(--win);
	}

	.box.red {
		background: color-mix(in srgb, #5c1313 55%, var(--panel));
		border-color: #8c2626;
	}

	.box.red h4 {
		color: var(--loss);
	}
</style>
