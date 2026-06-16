<script lang="ts" module>
	import type { SwissResult, TournamentTeam } from '$lib/engine/tournament';

	interface MatchEntry {
		a: TournamentTeam;
		b: TournamentTeam;
		aScore: number | null;
		bScore: number | null;
		winner: 'A' | 'B' | null;
	}
	interface MatchCell {
		type: 'match';
		col: number;
		sort: number;
		record: string;
		matches: MatchEntry[];
	}
	interface ResultCell {
		type: 'result';
		col: number;
		sort: number;
		kind: 'q' | 'e';
		accent: 'green' | 'blue' | 'red';
		record: string;
		teams: TournamentTeam[];
	}
	type Cell = MatchCell | ResultCell;
</script>

<script lang="ts">
	import { base } from '$app/paths';
	import { teamLogos } from '$lib/data/teamLogos';

	let {
		swiss,
		revealed
	}: {
		swiss: SwissResult;
		/** Quantas rodadas da suíça já foram reveladas (0..n). */
		revealed: number;
	} = $props();

	const reduced =
		typeof window !== 'undefined' &&
		window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

	// Acompanha a ação: ao revelar uma rodada, rola até a coluna mais nova (à direita).
	let scroller: HTMLDivElement | undefined = $state();
	$effect(() => {
		revealed; // dependência
		if (scroller) scroller.scrollTo({ left: scroller.scrollWidth, behavior: reduced ? 'auto' : 'smooth' });
	});

	const shortName = (name: string) => name.replace(/\s+\d{4}$/, '');
	const teamYear = (name: string) => name.match(/\d{4}$/)?.[0] ?? '';
	const initials = (name: string) =>
		shortName(name)
			.split(/\s+/)
			.map((w) => w[0])
			.join('')
			.slice(0, 2)
			.toUpperCase();
	const hue = (name: string) => [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

	/** Registros recalculados só com as rodadas reveladas (p/ os cartões de resultado). */
	const records = $derived.by(() => {
		const map = new Map<string, { team: TournamentTeam; wins: number; losses: number }>();
		for (const m of swiss.rounds[0]?.matches ?? []) {
			map.set(m.a.id, { team: m.a, wins: 0, losses: 0 });
			map.set(m.b.id, { team: m.b, wins: 0, losses: 0 });
		}
		for (const r of swiss.rounds.slice(0, revealed)) {
			for (const m of r.matches) {
				const w = m.series.winner === 'A' ? m.a : m.b;
				const l = m.series.winner === 'A' ? m.b : m.a;
				map.get(w.id)!.wins++;
				map.get(l.id)!.losses++;
			}
		}
		return map;
	});

	const cells = $derived.by<Cell[]>(() => {
		const out: Cell[] = [];

		// Caixas de partida, agrupadas pelo registro de entrada (recordBefore).
		const byBucket = new Map<string, { w: number; l: number; matches: MatchEntry[] }>();
		for (const round of swiss.rounds) {
			for (const m of round.matches) {
				if (round.number > revealed + 1) continue; // ainda não previsto
				const w = m.recordBefore.wins;
				const l = m.recordBefore.losses;
				const key = `${w}-${l}`;
				const decided = round.number <= revealed;
				const entry: MatchEntry = {
					a: m.a,
					b: m.b,
					aScore: decided ? (m.bestOf === 1 ? m.series.maps[0].scoreA : m.series.scoreA) : null,
					bScore: decided ? (m.bestOf === 1 ? m.series.maps[0].scoreB : m.series.scoreB) : null,
					winner: decided ? m.series.winner : null
				};
				const bucket = byBucket.get(key) ?? { w, l, matches: [] };
				bucket.matches.push(entry);
				byBucket.set(key, bucket);
			}
		}
		for (const [record, b] of byBucket) {
			out.push({
				type: 'match',
				col: b.w + b.l,
				sort: b.w - b.l,
				record,
				matches: b.matches
			});
		}

		// Cartões de resultado: classificados (3 vitórias) e eliminados (3 derrotas).
		const qByLoss = new Map<number, TournamentTeam[]>();
		const eByWin = new Map<number, TournamentTeam[]>();
		for (const { team, wins, losses } of records.values()) {
			if (wins >= 3) qByLoss.set(losses, [...(qByLoss.get(losses) ?? []), team]);
			else if (losses >= 3) eByWin.set(wins, [...(eByWin.get(wins) ?? []), team]);
		}
		for (const [losses, teams] of qByLoss) {
			out.push({
				type: 'result',
				col: 3 + losses,
				sort: 3 - losses,
				kind: 'q',
				accent: losses === 2 ? 'blue' : 'green',
				record: `3-${losses}`,
				teams
			});
		}
		for (const [wins, teams] of eByWin) {
			out.push({
				type: 'result',
				col: 3 + wins,
				sort: wins - 3,
				kind: 'e',
				accent: 'red',
				record: `${wins}-3`,
				teams
			});
		}

		return out;
	});

	const columns = $derived.by(() => {
		const maxCol = cells.reduce((mx, c) => Math.max(mx, c.col), 0);
		const cols: Cell[][] = Array.from({ length: maxCol + 1 }, () => []);
		for (const c of cells) cols[c.col].push(c);
		for (const col of cols) col.sort((a, b) => b.sort - a.sort);
		return cols;
	});
</script>

{#snippet crest(t: TournamentTeam)}
	{@const logo = teamLogos[t.id]}
	{#if logo}
		<img class="crest" src="{base}/teamlogos/{logo}" alt="" loading="lazy" />
	{:else if t.isUser}
		<span class="crest ph star" aria-hidden="true">★</span>
	{:else}
		<span class="crest ph" style="background: hsl({hue(t.name)} 45% 26%)">{initials(t.name)}</span>
	{/if}
{/snippet}

{#snippet teamLine(t: TournamentTeam)}
	<span class="tline" class:user={t.isUser}>
		{@render crest(t)}
		<span class="ttext">
			<span class="tname">{shortName(t.name)}</span>
			{#if teamYear(t.name)}<span class="tyear">{teamYear(t.name)}</span>{/if}
		</span>
	</span>
{/snippet}

<div class="swiss-scroll" bind:this={scroller}>
	<div class="swiss">
		{#each columns as col, ci (ci)}
			<div class="col">
				{#each col as cell (cell.record)}
					{#if cell.type === 'match'}
						<div class="mbox">
							<span class="rec">{cell.record}</span>
							{#each cell.matches as m, mi (mi)}
								<div class="match" class:pending={m.winner === null}>
									<div class="row" class:win={m.winner === 'A'} class:lose={m.winner === 'B'}>
										{@render teamLine(m.a)}
										{#if m.aScore !== null}<span class="sc">{m.aScore}</span>{/if}
									</div>
									<div class="row" class:win={m.winner === 'B'} class:lose={m.winner === 'A'}>
										{@render teamLine(m.b)}
										{#if m.bScore !== null}<span class="sc">{m.bScore}</span>{/if}
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="rcard {cell.accent}">
							<span class="rlabel">{cell.kind === 'q' ? 'Playoffs' : 'Eliminado'}</span>
							<div class="rteams">
								{#each cell.teams as t (t.id)}
									{@render teamLine(t)}
								{/each}
							</div>
							<span class="rrec">{cell.record}</span>
						</div>
					{/if}
				{/each}
			</div>
		{/each}
	</div>
</div>

<style>
	.swiss-scroll {
		display: flex;
		margin-top: 1rem;
		overflow-x: auto;
		padding-bottom: 0.5rem;
	}

	/* margin auto centraliza quando o bracket cabe; colapsa p/ 0 (rolável) quando estoura */
	.swiss {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		flex: 0 0 auto;
		margin: auto;
	}

	.col {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.5rem;
		flex: 0 0 auto;
	}

	/* ===== Caixa de partidas de um registro ===== */
	.mbox {
		position: relative;
		width: 8.8rem;
		background: linear-gradient(180deg, var(--panel-2), var(--panel));
		border: 1px solid var(--border);
		border-top: 2px solid var(--border-strong);
		padding: 0.45rem 0.45rem 0.45rem;
		clip-path: polygon(
			var(--cut-sm) 0,
			100% 0,
			100% calc(100% - var(--cut-sm)),
			calc(100% - var(--cut-sm)) 100%,
			0 100%,
			0 var(--cut-sm)
		);
	}

	.rec {
		display: inline-block;
		margin: 0 0 0.4rem 0.1rem;
		font-family: var(--font-display);
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		color: #1a1206;
		background: var(--muted);
		padding: 0.08rem 0.45rem 0.02rem;
		font-variant-numeric: tabular-nums;
	}

	.match {
		padding: 0.18rem 0;
	}

	.match + .match {
		margin-top: 0.18rem;
		border-top: 1px dashed color-mix(in srgb, var(--border) 70%, transparent);
		padding-top: 0.32rem;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.14rem 0.12rem;
	}

	.row .sc {
		margin-left: auto;
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 0.95rem;
		font-variant-numeric: tabular-nums;
		color: var(--muted);
	}

	.row.win {
		background: linear-gradient(90deg, color-mix(in srgb, var(--win) 16%, transparent), transparent 80%);
	}
	.row.win .sc {
		color: var(--win);
	}
	.row.win .tname {
		color: var(--text);
	}
	.row.lose {
		opacity: 0.5;
	}

	.match.pending .row {
		opacity: 0.85;
	}

	/* ===== Linha de time (logo + nome + ano) ===== */
	.tline {
		display: inline-flex;
		align-items: center;
		gap: 0.32rem;
		min-width: 0;
	}

	.crest {
		width: 1.6rem;
		height: 1.6rem;
		object-fit: contain;
		flex-shrink: 0;
	}

	.crest.ph {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		font-family: var(--font-display);
		font-size: 0.62rem;
		font-weight: 700;
		color: #fff;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
	}

	.crest.ph.star {
		background: transparent;
		color: var(--accent);
		font-size: 1.15rem;
		text-shadow: 0 0 8px color-mix(in srgb, var(--accent) 70%, transparent);
	}

	.ttext {
		display: flex;
		flex-direction: column;
		min-width: 0;
		line-height: 1.05;
	}

	.tname {
		font-family: var(--font-display);
		font-size: 0.84rem;
		font-weight: 700;
		text-transform: uppercase;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.tline.user .tname {
		color: var(--accent-bright);
	}

	.tyear {
		font-size: 0.62rem;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}

	/* ===== Cartão de resultado (classificado / eliminado) ===== */
	.rcard {
		position: relative;
		width: 8.8rem;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding: 0.75rem 0.55rem 0.6rem;
		border: 1px solid;
		clip-path: polygon(
			var(--cut-sm) 0,
			100% 0,
			100% calc(100% - var(--cut-sm)),
			calc(100% - var(--cut-sm)) 100%,
			0 100%,
			0 var(--cut-sm)
		);
	}

	.rlabel {
		font-family: var(--font-display);
		font-size: 0.66rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	.rteams {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.rrec {
		position: absolute;
		top: 0.5rem;
		right: 0.55rem;
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		line-height: 1;
	}

	.rcard.green {
		background:
			linear-gradient(180deg, color-mix(in srgb, var(--win) 16%, transparent), transparent),
			var(--panel);
		border-color: color-mix(in srgb, var(--win) 55%, var(--border));
		box-shadow: 0 0 18px -6px color-mix(in srgb, var(--win) 60%, transparent);
	}
	.rcard.green .rlabel,
	.rcard.green .rrec {
		color: var(--win);
	}

	.rcard.blue {
		background:
			linear-gradient(180deg, color-mix(in srgb, var(--ct) 16%, transparent), transparent),
			var(--panel);
		border-color: color-mix(in srgb, var(--ct) 55%, var(--border));
		box-shadow: 0 0 18px -6px color-mix(in srgb, var(--ct) 60%, transparent);
	}
	.rcard.blue .rlabel,
	.rcard.blue .rrec {
		color: var(--ct);
	}

	.rcard.red {
		background:
			linear-gradient(180deg, color-mix(in srgb, var(--loss) 15%, transparent), transparent),
			var(--panel);
		border-color: color-mix(in srgb, var(--loss) 50%, var(--border));
		box-shadow: 0 0 18px -6px color-mix(in srgb, var(--loss) 55%, transparent);
	}
	.rcard.red .rlabel,
	.rcard.red .rrec {
		color: var(--loss);
	}
</style>
