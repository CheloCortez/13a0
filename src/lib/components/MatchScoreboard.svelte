<script lang="ts">
	import { base } from '$app/paths';
	import { playerImages } from '$lib/data/playerImages';
	import { teamLogos } from '$lib/data/teamLogos';
	import type { PlayerLine } from '$lib/engine/boxscore';

	export interface ScoreRow extends PlayerLine {
		/** Major de origem da foto da época do jogador. */
		majorId?: string;
	}
	export interface ScoreTeam {
		name: string;
		/** Chave `${majorId}/${teamId}` da logo (ou undefined p/ o usuário). */
		logoKey?: string;
		isUser?: boolean;
		score: number;
		won: boolean;
		players: ScoreRow[];
	}

	let {
		caption,
		teamA,
		teamB
	}: {
		caption?: string;
		teamA: ScoreTeam;
		teamB: ScoreTeam;
	} = $props();

	const photoOf = (majorId: string | undefined, nick: string) => {
		const k = nick.toLowerCase();
		return (majorId ? playerImages.byMajor[`${majorId}/${k}`] : undefined) ?? playerImages.byNick[k];
	};
	// Jogadores ordenados por Rating 3.0 (melhor em cima), como no CS2.
	const sortRows = (players: ScoreRow[]) => [...players].sort((a, b) => b.rating3 - a.rating3);
</script>

<div class="scoreboard">
	{#if caption}<p class="caption">{caption}</p>{/if}
	{#each [teamA, teamB] as team (team.name)}
		<div class="team" class:won={team.won}>
			<div class="thead">
				<div class="crest-cell">
					{#if team.logoKey && teamLogos[team.logoKey]}
						<img class="crest" src="{base}/teamlogos/{teamLogos[team.logoKey]}" alt="" />
					{:else}
						<span class="crest crest-user" aria-hidden="true">★</span>
					{/if}
					<span class="tname" class:user={team.isUser}>{team.name}</span>
					<span class="tscore">{team.score}</span>
				</div>
				<span class="col">K-D</span>
				<span class="col">ADR</span>
				<span class="col">KAST</span>
				<span class="col rat">Rating 3.0</span>
			</div>
			{#each sortRows(team.players) as p (p.nick)}
				<div class="prow">
					<span class="pcell">
						<span class="pphoto" aria-hidden="true">
							{#if photoOf(p.majorId, p.nick)}
								<img src="{base}/players/{photoOf(p.majorId, p.nick)}" alt="" loading="lazy" />
							{/if}
						</span>
						<span class="pnick">{p.nick}</span>
					</span>
					<span class="col kd">{p.kills}-{p.deaths}</span>
					<span class="col">{p.adr.toFixed(1)}</span>
					<span class="col">{p.kast.toFixed(1)}%</span>
					<span class="col rat" class:up={p.rating3 >= 1} class:down={p.rating3 < 1}>{p.rating3.toFixed(2)}</span>
				</div>
			{/each}
		</div>
	{/each}
</div>

<style>
	.scoreboard {
		border: 1px solid var(--border);
		background: var(--panel);
		overflow-x: auto;
	}

	.caption {
		margin: 0;
		padding: 0.4rem 0.7rem;
		font-family: var(--font-display);
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--muted);
		background: var(--panel-2);
		border-bottom: 1px solid var(--border);
	}

	.team {
		min-width: 21rem;
	}

	.team + .team {
		border-top: 2px solid var(--border-strong);
	}

	/* grade compartilhada por header e linhas */
	.thead,
	.prow {
		display: grid;
		grid-template-columns: minmax(8rem, 1fr) 3.6rem 3.4rem 4rem 4rem;
		align-items: center;
		gap: 0.25rem;
		padding: 0.2rem 0.7rem;
	}

	.thead {
		background: linear-gradient(90deg, var(--panel-3), var(--panel-2));
		border-bottom: 1px solid var(--border);
		border-left: 3px solid var(--border-strong);
	}

	.team.won .thead {
		border-left-color: var(--accent);
	}

	.crest-cell {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		min-width: 0;
	}

	.crest {
		width: 1.5rem;
		height: 1.5rem;
		object-fit: contain;
		flex-shrink: 0;
	}

	.crest-user {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: var(--accent);
		font-size: 1rem;
	}

	.tname {
		font-family: var(--font-display);
		font-size: 0.92rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.02em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.tname.user {
		color: var(--accent-bright);
	}

	.tscore {
		font-family: var(--font-display);
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		margin-left: 0.3rem;
		color: var(--text);
	}

	.team.won .tscore {
		color: var(--win);
	}

	.col {
		font-family: var(--font-display);
		font-size: 0.8rem;
		font-variant-numeric: tabular-nums;
		text-align: right;
		color: var(--text);
	}

	.thead .col {
		font-size: 0.66rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.prow + .prow {
		border-top: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
	}

	.prow:nth-child(even) {
		background: color-mix(in srgb, var(--panel-2) 35%, transparent);
	}

	.pcell {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		min-width: 0;
	}

	.pphoto {
		width: 1.7rem;
		height: 1.7rem;
		border-radius: 3px;
		overflow: hidden;
		background: var(--panel-3);
		flex-shrink: 0;
	}

	.pphoto img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: top center;
		display: block;
	}

	.pnick {
		font-weight: 600;
		font-size: 0.84rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.kd {
		color: var(--muted);
	}

	.col.up {
		color: var(--win);
	}

	.col.down {
		color: var(--loss);
	}

	.col.rat {
		font-weight: 700;
	}
</style>
