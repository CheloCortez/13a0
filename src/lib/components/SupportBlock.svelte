<script lang="ts">
	import { PIX_PAYLOAD, KOFI_URL } from '$lib/config/support';
	import { writeClipboard } from '$lib/clipboard';
	import pixQrRaw from '$lib/pix-qr.svg?raw';

	let { compact = false }: { compact?: boolean } = $props();

	let copied = $state(false);

	const hasPix = $derived(!!PIX_PAYLOAD);
	const hasKofi = $derived(!!KOFI_URL);
	const hasAny = $derived(hasPix || hasKofi);

	async function copyPix() {
		if (!PIX_PAYLOAD) return;
		if (await writeClipboard(PIX_PAYLOAD)) {
			copied = true;
			setTimeout(() => (copied = false), 2000);
		}
	}
</script>

{#if hasAny}
	<section class="support" class:compact>
		<h3>Curtiu? Apoie o projeto</h3>
		<p>
			O 13 a 0 é gratuito e feito por fã. Se quiser ajudar a manter o site no ar, um Pix de
			qualquer valor já faz diferença.
		</p>
		<div class="actions">
			{#if hasPix}
				<button class="btn" onclick={copyPix}>
					{copied ? '✓ Chave copiada!' : '📋 Copiar chave Pix'}
				</button>
			{/if}
			{#if hasKofi}
				<a class="btn kofi" href={KOFI_URL} target="_blank" rel="noopener">☕ Apoiar no Ko-fi</a>
			{/if}
		</div>
		{#if hasPix && !compact}
			<div class="qr" role="img" aria-label="QR code Pix para doação">
				{@html pixQrRaw}
			</div>
		{/if}
	</section>
{/if}

<style>
	.support {
		margin-top: 1.5rem;
		padding: 1.25rem;
		background: var(--panel, #141b24);
		border-top: 2px solid var(--accent);
	}
	.support.compact {
		margin-top: 1rem;
		padding: 1rem;
	}
	.support h3 {
		font-family: 'Rajdhani', sans-serif;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		margin: 0 0 0.4rem;
	}
	.support p {
		margin: 0 0 0.9rem;
		color: var(--muted, #9aa7b4);
		font-size: 0.95rem;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		align-items: center;
		justify-content: center;
	}
	.btn {
		display: inline-block;
		padding: 0.55rem 1rem;
		background: var(--accent);
		color: #0d1219;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		border: none;
		cursor: pointer;
		text-decoration: none;
		clip-path: polygon(
			var(--cut-sm, 8px) 0,
			100% 0,
			100% calc(100% - var(--cut-sm, 8px)),
			calc(100% - var(--cut-sm, 8px)) 100%,
			0 100%,
			0 var(--cut-sm, 8px)
		);
	}
	.btn.kofi {
		background: var(--ct);
		color: #fff;
	}
	.qr {
		display: block;
		margin: 1rem auto 0;
		background: #fff;
		padding: 6px;
		width: fit-content;
	}
	.qr :global(svg) {
		display: block;
		width: 180px;
		height: 180px;
	}
</style>
