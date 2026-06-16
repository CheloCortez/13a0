<script lang="ts">
	import { base } from '$app/paths';
	import { ROLES, ROLE_LABELS, type DraftedPlayer, type Role } from '$lib/data/types';
	import { playerImages } from '$lib/data/playerImages';

	let {
		picks,
		onMove,
		hideRating = false,
		hideRoles = false
	}: {
		picks: DraftedPlayer[];
		onMove: (nick: string, role: Role) => void;
		hideRating?: boolean;
		/** Almanaque: esconde as funções naturais do jogador nos chips. */
		hideRoles?: boolean;
	} = $props();

	const photoOf = (p: DraftedPlayer) =>
		playerImages.byMajor[`${p.majorId}/${p.nick.toLowerCase()}`] ?? playerImages.byNick[p.nick.toLowerCase()];

	const byRole = $derived(
		Object.fromEntries(ROLES.map((r) => [r, picks.filter((p) => p.slot === r)])) as Record<
			Role,
			DraftedPlayer[]
		>
	);

	// ===== Estado da interação (drag por pointer + seleção por toque/teclado) =====
	let selected = $state<string | null>(null);
	let dragging = $state<string | null>(null);
	let overRole = $state<Role | null>(null);
	let ghostX = $state(0);
	let ghostY = $state(0);

	let armed: string | null = null;
	let startX = 0;
	let startY = 0;
	let didDrag = false;

	function onPointerDown(e: PointerEvent, nick: string) {
		if (e.button != null && e.button !== 0) return;
		armed = nick;
		startX = e.clientX;
		startY = e.clientY;
		didDrag = false;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}

	function onPointerMove(e: PointerEvent) {
		if (armed === null) return;
		if (!dragging) {
			if (Math.hypot(e.clientX - startX, e.clientY - startY) < 6) return;
			dragging = armed;
			didDrag = true;
			selected = null;
		}
		ghostX = e.clientX;
		ghostY = e.clientY;
		const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
		overRole = (el?.closest('[data-role]')?.getAttribute('data-role') as Role | null) ?? null;
	}

	function onPointerUp() {
		if (dragging) {
			if (overRole) onMove(dragging, overRole);
			dragging = null;
			overRole = null;
		}
		armed = null;
	}

	function onChipClick(nick: string) {
		if (didDrag) {
			didDrag = false;
			return;
		}
		selected = selected === nick ? null : nick;
	}

	/** Clique/Enter numa casa: move o jogador selecionado para ela. */
	function onBinActivate(role: Role) {
		if (selected) {
			onMove(selected, role);
			selected = null;
		}
	}

	const draggingPlayer = $derived(dragging ? picks.find((p) => p.nick === dragging) ?? null : null);
</script>

<div class="board" class:has-selection={selected !== null || dragging !== null}>
	{#each ROLES as role (role)}
		<div
			class="bin"
			class:over={overRole === role}
			data-role={role}
			role="button"
			tabindex="0"
			aria-label="Mover jogador selecionado para {ROLE_LABELS[role]}"
			onclick={() => onBinActivate(role)}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					onBinActivate(role);
				}
			}}
		>
			<div class="bin-head">
				<span class="bin-label badge badge-{role}">{ROLE_LABELS[role]}</span>
				<span class="bin-count">{byRole[role].length}</span>
			</div>
			<div class="bin-body">
				{#each byRole[role] as p (p.nick)}
					<button
						type="button"
						class="chip"
						class:selected={selected === p.nick}
						class:ghosted={dragging === p.nick}
						class:user-pick={true}
						onpointerdown={(e) => onPointerDown(e, p.nick)}
						onpointermove={onPointerMove}
						onpointerup={onPointerUp}
						onpointercancel={onPointerUp}
						onclick={(e) => {
							e.stopPropagation();
							onChipClick(p.nick);
						}}
						aria-pressed={selected === p.nick}
						aria-label={p.nick}
					>
						<span class="chip-portrait" aria-hidden="true">
							{#if photoOf(p)}
								<img class="chip-photo" src="{base}/players/{photoOf(p)}" alt="" loading="lazy" />
							{:else}
								<svg viewBox="0 0 64 64" fill="currentColor">
									<circle cx="32" cy="24" r="11" />
									<path d="M10 60c2-14 10-21 22-21s20 7 22 21z" />
								</svg>
							{/if}
						</span>
						<span class="chip-info">
							<span class="chip-nick">{p.nick}</span>
							{#if !hideRoles}
								<span class="chip-nat">{ROLE_LABELS[p.role]}{#if p.role2} · {ROLE_LABELS[p.role2]}{/if}</span>
							{/if}
						</span>
						{#if !hideRating}<span class="chip-rating">{p.rating.toFixed(2)}</span>{/if}
					</button>
				{/each}
				{#if byRole[role].length === 0}
					<span class="empty">{selected ? 'Solte aqui' : 'vazio'}</span>
				{/if}
			</div>
		</div>
	{/each}
</div>

<p class="hint muted">
	Arraste um jogador para a casa da função desejada — ou toque num jogador e depois na função
	(funciona no teclado com Enter). Qualquer combinação é permitida; funções repetidas reduzem a
	força, mostrada abaixo.
</p>

{#if draggingPlayer}
	<div class="ghost" style="left: {ghostX}px; top: {ghostY}px;" aria-hidden="true">
		{#if photoOf(draggingPlayer)}
			<img class="chip-photo" src="{base}/players/{photoOf(draggingPlayer)}" alt="" />
		{/if}
		<span class="chip-nick">{draggingPlayer.nick}</span>
	</div>
{/if}

<style>
	.board {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 0.6rem;
		margin-top: 0.8rem;
	}

	.bin {
		display: flex;
		flex-direction: column;
		background: linear-gradient(180deg, var(--panel-2), var(--panel));
		border: 1px solid var(--border);
		border-top: 2px solid var(--border-strong);
		padding: 0.5rem 0.45rem 0.55rem;
		min-height: 5rem;
		cursor: default;
		transition: box-shadow 0.12s, border-color 0.12s;
	}

	.board.has-selection .bin {
		border-top-color: color-mix(in srgb, var(--accent) 60%, var(--border-strong));
		cursor: pointer;
	}

	.bin.over {
		border-color: var(--accent);
		box-shadow: inset 0 0 0 1px var(--accent), 0 0 16px -6px var(--accent);
	}

	.bin-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.45rem;
	}

	.bin-label {
		font-size: 0.66rem;
	}

	.bin-count {
		font-family: var(--font-display);
		font-size: 0.78rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: var(--muted);
	}

	.bin-body {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		flex: 1;
	}

	.chip {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.28rem 0.4rem 0.28rem 0.28rem;
		width: 100%;
		text-align: left;
		background: var(--bg-raise);
		box-shadow: inset 0 0 0 1px var(--border);
		color: var(--text);
		cursor: grab;
		touch-action: none; /* permite o drag por pointer no toque sem rolar a página */
		clip-path: polygon(var(--cut-sm) 0, 100% 0, 100% calc(100% - var(--cut-sm)), calc(100% - var(--cut-sm)) 100%, 0 100%, 0 var(--cut-sm));
		transition: box-shadow 0.12s, transform 0.12s;
	}

	.chip:hover {
		box-shadow: inset 0 0 0 1px var(--accent-bright);
	}

	.chip.selected {
		box-shadow: inset 0 0 0 2px var(--accent), 0 0 14px -5px var(--accent);
	}

	.chip.ghosted {
		opacity: 0.35;
	}

	.chip-portrait {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		flex-shrink: 0;
		overflow: hidden;
		background: linear-gradient(160deg, #283444, #1a212c);
		color: #3e4c5f;
		clip-path: polygon(var(--cut-sm) 0, 100% 0, 100% calc(100% - var(--cut-sm)), calc(100% - var(--cut-sm)) 100%, 0 100%, 0 var(--cut-sm));
	}

	.chip-photo {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: top center;
	}

	.chip-info {
		display: flex;
		flex-direction: column;
		min-width: 0;
		line-height: 1.1;
	}

	.chip-nick {
		font-family: var(--font-display);
		font-size: 0.82rem;
		font-weight: 700;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.chip-nat {
		font-size: 0.6rem;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.chip-rating {
		margin-left: auto;
		font-family: var(--font-display);
		font-variant-numeric: tabular-nums;
		font-weight: 700;
		font-size: 0.8rem;
		color: var(--accent);
	}

	.empty {
		font-size: 0.72rem;
		color: var(--muted);
		font-style: italic;
		padding: 0.3rem 0.1rem;
	}

	.board.has-selection .empty {
		color: var(--accent);
		font-style: normal;
	}

	.hint {
		font-size: 0.78rem;
		margin: 0.7rem 0 0;
	}

	.ghost {
		position: fixed;
		z-index: 50;
		transform: translate(-50%, -50%);
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.3rem 0.55rem 0.3rem 0.3rem;
		background: var(--panel-2);
		box-shadow: 0 0 0 1px var(--accent), 0 10px 24px -10px rgba(0, 0, 0, 0.9);
		pointer-events: none;
	}

	.ghost .chip-photo {
		width: 1.8rem;
		height: 1.8rem;
		object-fit: cover;
		object-position: top center;
	}

	.ghost .chip-nick {
		font-family: var(--font-display);
		font-size: 0.82rem;
		font-weight: 700;
	}

	@media (prefers-reduced-motion: reduce) {
		.chip {
			transition: none;
		}
	}
</style>
