<script lang="ts">
	import { untrack } from 'svelte';
	import { base } from '$app/paths';
	import { MAP_POOL, vetoSequence, type CsMap, type MapRecord, type VetoEntry } from '$lib/engine/maps';

	let {
		bestOf,
		opponentName,
		rngSeed,
		mapHistory,
		almanac = false,
		onDone
	}: {
		bestOf: 1 | 3 | 5;
		opponentName: string;
		rngSeed: number;
		mapHistory?: { user: MapRecord[]; opponent: MapRecord[] };
		almanac?: boolean;
		onDone: (maps: CsMap[]) => void;
	} = $props();

	const OPPONENT_DELAY = 750; // ms antes do oponente agir
	const DONE_PAUSE    = 700; // ms após último step antes de chamar onDone

	// ---- Estado do veto ----
	const steps = $derived(vetoSequence(bestOf));
	let stepIndex = $state(0);
	let entries   = $state<VetoEntry[]>(
		MAP_POOL.map((m) => ({ map: m, state: 'available' as const, actor: null }))
	);
	let picked     = $state<string[]>([]);
	let rngState   = $state(untrack(() => rngSeed) >>> 0);
	let phase      = $state<'user' | 'opponent' | 'done'>('opponent');
	let done       = $state(false);

	// LCG (igual ao de autoResolveVeto)
	function lcgNext(s: number): number {
		return (Math.imul(s, 1664525) + 1013904223) >>> 0;
	}

	// IDs dos mapas ainda disponíveis — derivado de entries
	const remaining = $derived(entries.filter((e) => e.state === 'available').map((e) => e.map.id));

	// Passo atual
	const currentStep = $derived(steps[stepIndex] ?? null);

	// Mapas selecionados (picks + decider) na ordem de jogo — disponível só após o decider existir
	const selectedMaps = $derived.by((): CsMap[] => {
		const decider = entries.find((e) => e.state === 'decider');
		if (!decider) return [];
		const pickedMaps = picked.map((id) => MAP_POOL.find((m) => m.id === id)!);
		return bestOf === 1 ? [decider.map] : [...pickedMaps, decider.map];
	});

	// Aplica uma ação (ban ou pick) ao mapa indicado
	function applyAction(mapId: string) {
		const step = currentStep;
		if (!step) return;
		const idx = entries.findIndex((e) => e.map.id === mapId);
		if (idx < 0 || entries[idx].state !== 'available') return;

		if (step.actor === 'opponent') rngState = lcgNext(rngState);

		const newState: 'banned' | 'picked' = step.action === 'ban' ? 'banned' : 'picked';
		entries[idx] = { ...entries[idx], state: newState, actor: step.actor };
		if (step.action === 'pick') picked = [...picked, mapId];
		stepIndex++;
	}

	// Loop de animação / interação dos passos do veto
	$effect(() => {
		if (done) return;

		const step = currentStep;

		if (step) {
			if (step.actor === 'user') {
				phase = 'user';
				return; // espera clique do usuário
			}
			// Turno do oponente: escolha automática via LCG
			phase = 'opponent';
			const rem = remaining;
			const nextRng = lcgNext(rngState);
			const choice = rem[nextRng % rem.length];
			const t = setTimeout(() => applyAction(choice), OPPONENT_DELAY);
			return () => clearTimeout(t);
		}

		// Todos os steps concluídos: definir o decider e encerrar.
		// (Não agendamos onDone aqui: mutar entries/done re-dispara este effect e o cleanup
		//  cancelaria o timeout. A finalização fica num effect dedicado abaixo.)
		if (remaining.length === 1) {
			const deciderId = remaining[0];
			const dIdx = entries.findIndex((e) => e.map.id === deciderId);
			entries[dIdx] = { ...entries[dIdx], state: 'decider' as const, actor: null };
		}
		done = true;
		phase = 'done';
	});

	// Finalização: quando o veto encerra, entrega os mapas após uma breve pausa.
	$effect(() => {
		if (!done) return;
		const maps = selectedMaps;
		const t = setTimeout(() => onDone(maps), DONE_PAUSE);
		return () => clearTimeout(t);
	});

	// ---- Helpers de display ----

	function stateLabel(e: VetoEntry): string {
		if (e.state === 'banned')  return 'BAN';
		if (e.state === 'picked')  return 'PICK';
		if (e.state === 'decider') return 'DECIDER';
		return '';
	}

	function getRecord(history: MapRecord[] | undefined, mapId: string): MapRecord | null {
		if (!history) return null;
		return history.find((r) => r.mapId === mapId) ?? null;
	}

	function mapModifier(mapId: string): number {
		const rec = getRecord(mapHistory?.user, mapId);
		if (!rec) return 0;
		return (rec.wins - rec.losses) * 2;
	}

	const headerText = $derived.by(() => {
		if (phase === 'done') return 'Mapas definidos';
		const step = currentStep;
		if (!step) return '';
		if (step.actor === 'user') {
			return step.action === 'ban' ? 'Banir um mapa' : 'Escolher um mapa';
		}
		return step.action === 'ban'
			? `${opponentName} está banindo…`
			: `${opponentName} está escolhendo…`;
	});
</script>

<div class="veto" class:done>
	<p class="stage-tag">Pick/Ban de mapas</p>
	<p class="veto-header" class:user-turn={phase === 'user'}>{headerText}</p>

	{#if !almanac}
		<p class="hist-legend">
			Histórico no Major:
			<span class="legend-item user-legend">★ Seu time</span>
			<span class="legend-item opp-legend">● {opponentName}</span>
		</p>
		<p class="veto-hint muted">
			Cada vitória do seu time em um mapa vale +2% de força nele — e cada derrota, −2%.
			Escolha bem seus picks.
		</p>
	{/if}

	<div class="map-list">
		{#each entries as entry (entry.map.id)}
			{@const canClick = phase === 'user' && entry.state === 'available'}
			{@const userRec = getRecord(mapHistory?.user, entry.map.id)}
			{@const oppRec  = getRecord(mapHistory?.opponent, entry.map.id)}
			{@const mod     = mapModifier(entry.map.id)}

			<button
				class="map-row"
				class:banned={entry.state === 'banned'}
				class:picked={entry.state === 'picked'}
				class:decider={entry.state === 'decider'}
				class:clickable={canClick}
				disabled={!canClick}
				onclick={() => canClick && applyAction(entry.map.id)}
				aria-label="{entry.map.name} — {stateLabel(entry) || 'disponível'}"
			>
				<!-- Thumbnail -->
				<div class="thumb-wrap">
					<img
						class="thumb"
						src="{base}{entry.map.image}"
						alt={entry.map.name}
						loading="lazy"
					/>
					{#if entry.state === 'banned'}
						<div class="thumb-overlay ban-overlay">
							<span class="overlay-slash" aria-hidden="true"></span>
						</div>
					{:else if entry.state === 'picked' || entry.state === 'decider'}
						<div class="thumb-overlay pick-overlay"></div>
					{/if}
				</div>

				<!-- Nome + histórico -->
				<div class="map-info">
					<span class="map-name">{entry.map.name}</span>
					{#if !almanac && mod !== 0}
						<span class="map-mod" class:mod-pos={mod > 0} class:mod-neg={mod < 0}>
							{mod > 0 ? '+' : ''}{mod}%
						</span>
					{/if}
				</div>

				<!-- Histórico dos dois times (oculto no Almanaque) -->
				{#if !almanac}
					<div class="history-badges">
						{#if userRec && userRec.wins + userRec.losses > 0}
							<span class="hist-badge user-badge">★ {userRec.wins}V {userRec.losses}D</span>
						{/if}
						{#if oppRec && oppRec.wins + oppRec.losses > 0}
							<span class="hist-badge opp-badge">● {oppRec.wins}V {oppRec.losses}D</span>
						{/if}
					</div>
				{/if}

				<!-- Badge de estado -->
				{#if entry.state !== 'available'}
					<span class="state-badge"
						class:ban-badge={entry.state === 'banned'}
						class:pick-badge={entry.state === 'picked'}
						class:decider-badge={entry.state === 'decider'}>
						{stateLabel(entry)}
					</span>
				{/if}
			</button>
		{/each}
	</div>
</div>

<style>
	.veto {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.stage-tag {
		margin: 0;
		font-family: var(--font-display);
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--accent);
	}

	.veto-header {
		margin: 0;
		font-family: var(--font-display);
		font-size: 0.9rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
		transition: color 0.2s;
		min-height: 1.2em;
	}

	.veto-header.user-turn {
		color: var(--accent-bright);
	}

	.hist-legend {
		margin: -0.15rem 0 0;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		font-family: var(--font-display);
		font-size: 0.62rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.legend-item {
		font-weight: 700;
	}

	.user-legend { color: var(--accent-bright); }
	.opp-legend  { color: var(--ct); }

	.veto-hint {
		margin: -0.1rem 0 0;
		font-size: 0.72rem;
		line-height: 1.4;
	}

	.map-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	/* Linha de mapa — agora é <button> para acessibilidade */
	.map-row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.3rem 0.6rem 0.3rem 0.3rem;
		background: var(--panel-2);
		border: 1px solid var(--border);
		border-left: 3px solid var(--border-strong);
		transition: border-color 0.2s, background 0.2s, opacity 0.2s;
		min-height: 3rem;
		width: 100%;
		text-align: left;
		cursor: default;
		color: inherit;
		font: inherit;
	}

	.map-row.clickable {
		cursor: pointer;
	}

	.map-row.clickable:hover,
	.map-row.clickable:focus-visible {
		border-left-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 8%, var(--panel-2));
		outline: none;
	}

	.map-row.banned {
		opacity: 0.45;
		border-left-color: var(--loss);
		background: color-mix(in srgb, var(--loss) 5%, var(--panel));
	}

	.map-row.picked {
		border-left-color: var(--win);
		background: color-mix(in srgb, var(--win) 6%, var(--panel-2));
	}

	.map-row.decider {
		border-left-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 6%, var(--panel-2));
	}

	/* Thumbnail */
	.thumb-wrap {
		position: relative;
		width: 72px;
		height: 40px;
		flex-shrink: 0;
		overflow: hidden;
	}

	.thumb {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.thumb-overlay {
		position: absolute;
		inset: 0;
	}

	.ban-overlay {
		background: rgba(255, 80, 60, 0.45);
	}

	.overlay-slash {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			135deg,
			transparent 46%,
			rgba(255, 80, 60, 0.7) 46%,
			rgba(255, 80, 60, 0.7) 54%,
			transparent 54%
		);
	}

	.pick-overlay {
		background: rgba(95, 221, 146, 0.2);
		box-shadow: inset 0 0 0 2px rgba(95, 221, 146, 0.5);
	}

	/* Info: nome + modificador */
	.map-info {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		flex: 1;
		min-width: 0;
	}

	.map-name {
		font-family: var(--font-display);
		font-size: 0.9rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.map-row.banned .map-name  { color: var(--muted); }
	.map-row.picked .map-name  { color: var(--win); }
	.map-row.decider .map-name { color: var(--accent-bright); }

	.map-mod {
		font-family: var(--font-display);
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.08em;
	}

	.map-mod.mod-pos { color: var(--win); }
	.map-mod.mod-neg { color: var(--loss); }

	/* Badges de histórico */
	.history-badges {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		align-items: flex-end;
		flex-shrink: 0;
	}

	.hist-badge {
		font-family: var(--font-display);
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		white-space: nowrap;
		padding: 0.08rem 0.3rem;
		border-radius: 2px;
	}

	.user-badge {
		background: color-mix(in srgb, var(--accent) 18%, var(--panel-3));
		color: var(--accent-bright);
	}

	.opp-badge {
		background: color-mix(in srgb, var(--ct) 18%, var(--panel-3));
		color: var(--ct);
	}

	/* Badge de estado (BAN/PICK/DECIDER) */
	.state-badge {
		font-family: var(--font-display);
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		padding: 0.15rem 0.4rem;
		flex-shrink: 0;
		clip-path: polygon(
			var(--cut-sm) 0, 100% 0,
			100% calc(100% - var(--cut-sm)),
			calc(100% - var(--cut-sm)) 100%,
			0 100%, 0 var(--cut-sm)
		);
	}

	.ban-badge {
		background: color-mix(in srgb, var(--loss) 20%, var(--panel-3));
		color: var(--loss);
	}

	.pick-badge {
		background: color-mix(in srgb, var(--win) 20%, var(--panel-3));
		color: var(--win);
	}

	.decider-badge {
		background: color-mix(in srgb, var(--accent) 20%, var(--panel-3));
		color: var(--accent-bright);
	}

	@media (prefers-reduced-motion: reduce) {
		.map-row { transition: none; }
	}
</style>
