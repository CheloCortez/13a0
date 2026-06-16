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
			<h4>Classificados aos playoffs</h4>
			<div class="list">
				{#each qualified as s (s.team.id)}
					<TeamChip name={s.team.name} id={s.team.id} isUser={s.team.isUser} record="{s.wins}-{s.losses}" />
				{/each}
			</div>
		</div>
	{/if}

	{#each buckets as [record, matches] (record)}
		<div class="bucket">
			<h4>{record}</h4>
			{#each matches as m (m.a.id + m.b.id)}
				<div class="pair" class:user={m.a.isUser || m.b.isUser}>
					<TeamChip name={m.a.name} id={m.a.id} isUser={m.a.isUser} />
					<span class="vs">vs</span>
					<TeamChip name={m.b.name} id={m.b.id} isUser={m.b.isUser} />
				</div>
			{/each}
		</div>
	{/each}

	{#if eliminated.length > 0}
		<div class="box red">
			<h4>Eliminados</h4>
			<div class="list">
				{#each eliminated as s (s.team.id)}
					<TeamChip name={s.team.name} id={s.team.id} isUser={s.team.isUser} record="{s.wins}-{s.losses}" />
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
		margin: 0 0 0.5rem;
		font-size: 0.82rem;
		letter-spacing: 0.12em;
	}

	.bucket {
		background: linear-gradient(180deg, var(--panel-2), var(--panel));
		border: 1px solid var(--border);
		padding: 0.65rem 0.8rem;
	}

	/* Registro (ex: 2-1) como selo chanfrado */
	.bucket h4 {
		display: inline-block;
		color: #1a1206;
		background: var(--accent);
		padding: 0.06rem 0.55rem 0;
		font-variant-numeric: tabular-nums;
		clip-path: polygon(var(--cut-sm) 0, 100% 0, 100% calc(100% - var(--cut-sm)), calc(100% - var(--cut-sm)) 100%, 0 100%, 0 var(--cut-sm));
	}

	.pair {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: 0.5rem;
		padding: 0.38rem 0.4rem;
	}

	.pair + .pair {
		border-top: 1px solid var(--border);
	}

	.pair.user {
		background: linear-gradient(90deg, color-mix(in srgb, var(--accent) 10%, transparent), transparent 60%);
		box-shadow: inset 2px 0 0 var(--accent);
	}

	.pair :global(.chip:last-of-type) {
		justify-self: end;
	}

	.vs {
		font-family: var(--font-display);
		color: var(--muted);
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.box {
		padding: 0.65rem 0.8rem;
		border: 1px solid;
	}

	.box .list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
		gap: 0.45rem 0.8rem;
	}

	.box.green {
		background:
			linear-gradient(180deg, color-mix(in srgb, var(--win) 11%, transparent), transparent),
			var(--panel);
		border-color: color-mix(in srgb, var(--win) 38%, var(--border));
		border-top-width: 2px;
	}

	.box.green h4 {
		color: var(--win);
	}

	.box.red {
		background:
			linear-gradient(180deg, color-mix(in srgb, var(--loss) 10%, transparent), transparent),
			var(--panel);
		border-color: color-mix(in srgb, var(--loss) 35%, var(--border));
		border-top-width: 2px;
	}

	.box.red h4 {
		color: var(--loss);
	}
</style>
