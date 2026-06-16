<script lang="ts">
	import { base } from '$app/paths';
	import { teamLogos } from '$lib/data/teamLogos';

	let {
		name,
		id,
		isUser = false,
		record
	}: {
		name: string;
		/** Chave `${majorId}/${teamId}` (ou "user") — escolhe a logo da época. */
		id?: string;
		isUser?: boolean;
		/** Registro final exibido ao lado (ex: "3-1"), usado nas caixas verde/vermelha. */
		record?: string;
	} = $props();

	const short = $derived(name.replace(/\s+\d{4}$/, ''));
	const year = $derived(name.match(/\d{4}$/)?.[0] ?? '');
	const initials = $derived(
		short
			.split(/\s+/)
			.map((w) => w[0])
			.join('')
			.slice(0, 2)
			.toUpperCase()
	);
	// Cor estável derivada do nome — fallback quando não há logo.
	const hue = $derived([...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7));
	const logo = $derived(id ? teamLogos[id] : undefined);
	let broken = $state(false);
	$effect(() => {
		logo;
		broken = false;
	});
</script>

<span class="chip" class:user={isUser} title={name}>
	{#if logo && !broken}
		<img class="logo logo-img" src="{base}/teamlogos/{logo}" alt="" loading="lazy" onerror={() => (broken = true)} />
	{:else if isUser}
		<span class="logo star" aria-hidden="true">★</span>
	{:else}
		<span class="logo" style="background: hsl({hue} 45% 26%); border-color: hsl({hue} 50% 40%)">
			{initials}
		</span>
	{/if}
	<span class="text">
		<span class="label">{short}</span>
		{#if year}<span class="year">{year}</span>{/if}
	</span>
	{#if record}<span class="record">{record}</span>{/if}
</span>

<style>
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		min-width: 0;
	}

	.logo {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.9rem;
		height: 1.9rem;
		border-radius: 50%;
		border: 2px solid;
		font-family: var(--font-display);
		font-size: 0.68rem;
		font-weight: 700;
		color: #fff;
		flex-shrink: 0;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
	}

	.chip.user .logo {
		border-color: var(--accent);
		box-shadow: 0 0 6px color-mix(in srgb, var(--accent) 60%, transparent);
	}

	.logo.star {
		background: transparent;
		border-color: var(--accent);
		color: var(--accent);
		font-size: 1rem;
		text-shadow: 0 0 8px color-mix(in srgb, var(--accent) 70%, transparent);
	}

	/* Logo real: sem recorte circular nem cor de fundo. */
	.logo-img {
		border: none;
		border-radius: 0;
		background: transparent;
		object-fit: contain;
		text-shadow: none;
	}

	.chip.user .logo-img {
		box-shadow: none;
	}

	.text {
		display: flex;
		flex-direction: column;
		min-width: 0;
		line-height: 1.15;
	}

	.label {
		font-size: 0.74rem;
		font-weight: 700;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.chip.user .label {
		color: var(--accent);
	}

	.year {
		font-size: 0.62rem;
		color: var(--muted);
	}

	.record {
		margin-left: auto;
		font-family: var(--font-display);
		font-size: 0.74rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: var(--muted);
	}
</style>
