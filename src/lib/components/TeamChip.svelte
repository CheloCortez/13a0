<script lang="ts">
	let {
		name,
		isUser = false,
		record
	}: {
		name: string;
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
	// Cor estável derivada do nome — placeholder até termos as logos reais.
	const hue = $derived([...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7));
</script>

<span class="chip" class:user={isUser} title={name}>
	<span class="logo" style="background: hsl({hue} 45% 26%); border-color: hsl({hue} 50% 40%)">
		{initials}
	</span>
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
		font-size: 0.66rem;
		font-weight: 800;
		color: #fff;
		flex-shrink: 0;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
	}

	.chip.user .logo {
		border-color: var(--accent);
		box-shadow: 0 0 6px color-mix(in srgb, var(--accent) 60%, transparent);
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
		font-size: 0.7rem;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
		color: var(--muted);
	}
</style>
