<script lang="ts" module>
	import type { BracketMatch, PlayoffsResult, TournamentTeam } from '$lib/engine/tournament';

	interface Slot {
		name: string;
		id: string;
		isUser: boolean;
		score?: number;
		won: boolean;
	}
	interface Box {
		label: string;
		a: Slot | null;
		b: Slot | null;
		/** algum dos lados é o time do usuário (conhecido) */
		user: boolean;
	}
</script>

<script lang="ts">
	import { base } from '$app/paths';
	import { teamLogos } from '$lib/data/teamLogos';

	let {
		playoffs,
		revealed
	}: {
		playoffs: PlayoffsResult;
		/** Fases de playoff já reveladas: 0 = só o chaveamento, 1 = quartas, 2 = semis, 3 = final. */
		revealed: number;
	} = $props();

	function slot(team: TournamentTeam, m: BracketMatch, isA: boolean, decided: boolean): Slot {
		return {
			name: team.name,
			id: team.id,
			isUser: team.isUser ?? false,
			score: decided ? (isA ? m.series.scoreA : m.series.scoreB) : undefined,
			won: decided && m.series.winner === (isA ? 'A' : 'B')
		};
	}
	const isUserBox = (m: BracketMatch) => (m.a.isUser || m.b.isUser) ?? false;

	const qfBoxes = $derived<Box[]>(
		playoffs.quarterfinals.map((m, i) => ({
			label: `Quartas ${i + 1}`,
			a: slot(m.a, m, true, revealed >= 1),
			b: slot(m.b, m, false, revealed >= 1),
			user: isUserBox(m)
		}))
	);
	const sfBoxes = $derived<Box[]>(
		playoffs.semifinals.map((m, i) => ({
			label: `Semifinal ${i + 1}`,
			a: revealed >= 1 ? slot(m.a, m, true, revealed >= 2) : null,
			b: revealed >= 1 ? slot(m.b, m, false, revealed >= 2) : null,
			user: revealed >= 1 && isUserBox(m)
		}))
	);
	const finalBox = $derived<Box>({
		label: 'Grande final',
		a: revealed >= 2 ? slot(playoffs.final.a, playoffs.final, true, revealed >= 3) : null,
		b: revealed >= 2 ? slot(playoffs.final.b, playoffs.final, false, revealed >= 3) : null,
		user: revealed >= 2 && isUserBox(playoffs.final)
	});

	const champion = $derived(revealed >= 3 ? playoffs.champion : null);
	const championLogo = $derived(champion ? teamLogos[champion.id] : undefined);

	function initials(name: string): string {
		return name
			.replace(/\s+\d{4}$/, '')
			.split(/\s+/)
			.map((w) => w[0])
			.join('')
			.slice(0, 2)
			.toUpperCase();
	}
	const hue = (name: string) =>
		[...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
	const shortName = (name: string) => name.replace(/\s+\d{4}$/, '');
	const teamYear = (name: string) => name.match(/\d{4}$/)?.[0] ?? '';
</script>

{#snippet teamSlot(s: Slot | null)}
	<div class="slot" class:user={s?.isUser} class:won={s?.won} class:tbd={!s}>
		{#if s}
			{@const logo = teamLogos[s.id]}
			{#if logo}
				<img class="logo" src="{base}/teamlogos/{logo}" alt="" loading="lazy" />
			{:else if s.isUser}
				<span class="logo ph star" aria-hidden="true">★</span>
			{:else}
				<span class="logo ph" style="background: hsl({hue(s.name)} 45% 26%)">{initials(s.name)}</span>
			{/if}
			<span class="text">
				<span class="name">{shortName(s.name)}</span>
				{#if teamYear(s.name)}<span class="year">{teamYear(s.name)}</span>{/if}
			</span>
			<span class="sc">{s.score ?? ''}</span>
		{:else}
			<span class="logo ph tbd-logo" aria-hidden="true">?</span>
			<span class="text"><span class="name muted">A definir</span></span>
			<span class="sc"></span>
		{/if}
	</div>
{/snippet}

{#snippet box(b: Box)}
	<div class="match-wrap">
		<div class="match" class:user={b.user}>
			<span class="mlabel">{b.label}</span>
			{@render teamSlot(b.a)}
			{@render teamSlot(b.b)}
		</div>
	</div>
{/snippet}

<div class="bracket-scroll">
	<div class="bracket">
		<div class="round round-qf">
			{#each qfBoxes as b (b.label)}{@render box(b)}{/each}
		</div>
		<div class="round round-sf">
			{#each sfBoxes as b (b.label)}{@render box(b)}{/each}
		</div>
		<div class="round round-final">
			{@render box(finalBox)}
		</div>
	</div>
</div>

{#if champion}
	<div class="champ">
		<span class="champ-tag">🏆 Campeão do Major</span>
		{#if championLogo}
			<img class="champ-logo" src="{base}/teamlogos/{championLogo}" alt="" />
		{:else if champion.isUser}
			<span class="champ-logo star" aria-hidden="true">★</span>
		{/if}
		<span class="champ-name" class:user={champion.isUser}>
			{shortName(champion.name)}{#if teamYear(champion.name)}<span class="champ-year">{teamYear(champion.name)}</span>{/if}
		</span>
	</div>
{/if}

<style>
	.bracket-scroll {
		margin-top: 1rem;
		overflow-x: auto;
		padding-bottom: 0.4rem;
	}

	.bracket {
		--c: 1.25rem; /* meia-distância dos conectores */
		--line: var(--border-strong);
		display: flex;
		gap: calc(var(--c) * 2);
		min-width: 32rem;
	}

	.round {
		flex: 1 1 0;
		min-width: 8.5rem;
		display: flex;
		flex-direction: column;
	}

	/* cada wrapper ocupa fração igual da coluna -> centros alinham entre fases */
	.match-wrap {
		flex: 1 1 0;
		display: flex;
		align-items: center;
		position: relative;
	}

	/* stub horizontal saindo de cada partida, atravessando o gap até a próxima coluna */
	.round:not(.round-final) .match-wrap::after {
		content: '';
		position: absolute;
		left: 100%;
		top: 50%;
		width: calc(var(--c) * 2);
		border-top: 2px solid var(--line);
	}

	/* barra vertical unindo cada par na borda da próxima coluna -> alimenta a fase seguinte */
	.round:not(.round-final) .match-wrap:nth-child(odd)::before {
		content: '';
		position: absolute;
		left: calc(100% + var(--c) * 2);
		top: 50%;
		height: 100%;
		border-right: 2px solid var(--line);
	}

	.match {
		width: 100%;
		background: linear-gradient(180deg, var(--panel-2), var(--panel));
		border: 1px solid var(--border);
		border-top: 2px solid var(--border-strong);
		padding: 0.4rem 0.5rem 0.45rem;
		clip-path: polygon(
			var(--cut-sm) 0,
			100% 0,
			100% calc(100% - var(--cut-sm)),
			calc(100% - var(--cut-sm)) 100%,
			0 100%,
			0 var(--cut-sm)
		);
	}

	.match.user {
		border-top-color: var(--accent);
		box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 35%, transparent);
	}

	.mlabel {
		display: block;
		margin-bottom: 0.3rem;
		font-family: var(--font-display);
		font-size: 0.62rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.match.user .mlabel {
		color: var(--accent);
	}

	.slot {
		display: grid;
		grid-template-columns: 1.4rem 1fr auto;
		align-items: center;
		gap: 0.45rem;
		padding: 0.22rem 0.1rem;
	}

	.slot + .slot {
		border-top: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
	}

	.logo {
		width: 1.4rem;
		height: 1.4rem;
		object-fit: contain;
		flex-shrink: 0;
	}

	.logo.ph {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		font-family: var(--font-display);
		font-size: 0.55rem;
		font-weight: 700;
		color: #fff;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
	}

	.tbd-logo {
		background: var(--panel-2) !important;
		color: var(--muted);
		border: 1px dashed var(--border-strong);
	}

	.logo.ph.star {
		background: transparent;
		color: var(--accent);
		font-size: 0.95rem;
		text-shadow: 0 0 8px color-mix(in srgb, var(--accent) 70%, transparent);
	}

	.champ-logo.star {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 2.6rem;
		color: var(--accent);
		text-shadow: 0 0 22px rgba(246, 168, 33, 0.5);
	}

	.text {
		display: flex;
		flex-direction: column;
		min-width: 0;
		line-height: 1.1;
	}

	.name {
		font-family: var(--font-display);
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: uppercase;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.year {
		font-size: 0.6rem;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}

	.name.muted {
		color: var(--muted);
		font-weight: 600;
	}

	.slot.user .name {
		color: var(--accent-bright);
	}

	.sc {
		font-family: var(--font-display);
		font-size: 0.95rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: var(--muted);
		min-width: 0.8ch;
		text-align: right;
	}

	.slot.won .sc {
		color: var(--win);
	}

	.slot.won .name {
		color: var(--text);
	}

	.slot.tbd .name {
		font-style: italic;
	}

	/* ===== Campeão ===== */
	.champ {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		margin-top: 1.2rem;
		padding: 1.1rem 1rem;
		background:
			radial-gradient(26rem 10rem at 50% -2rem, rgba(246, 168, 33, 0.18), transparent 70%),
			linear-gradient(180deg, var(--panel-2), var(--panel));
		border: 1px solid color-mix(in srgb, var(--accent) 55%, var(--border));
		border-top: 2px solid var(--accent);
	}

	.champ-tag {
		font-family: var(--font-display);
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--accent);
	}

	.champ-logo {
		width: 3.2rem;
		height: 3.2rem;
		object-fit: contain;
	}

	.champ-name {
		font-family: var(--font-display);
		font-size: 1.4rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.champ-name.user {
		color: var(--accent-bright);
		text-shadow: 0 0 22px rgba(246, 168, 33, 0.45);
	}

	.champ-year {
		margin-left: 0.5rem;
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
		text-shadow: none;
	}
</style>
