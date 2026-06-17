<script lang="ts">
	import { onMount } from 'svelte';
	import { ADSENSE_CLIENT, ADSENSE_SLOT } from '$lib/config/support';

	const enabled = !!ADSENSE_CLIENT && !!ADSENSE_SLOT;

	onMount(() => {
		if (!enabled) return;
		const id = 'adsense-loader';
		if (!document.getElementById(id)) {
			const s = document.createElement('script');
			s.id = id;
			s.async = true;
			s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
			s.crossOrigin = 'anonymous';
			document.head.appendChild(s);
		}
		try {
			// @ts-expect-error adsbygoogle é injetado pelo script externo
			(window.adsbygoogle = window.adsbygoogle || []).push({});
		} catch {
			/* adblock ou script bloqueado — degrada sem quebrar */
		}
	});
</script>

{#if enabled}
	<aside class="ad" aria-label="Publicidade">
		<ins
			class="adsbygoogle"
			style="display:block"
			data-ad-client={ADSENSE_CLIENT}
			data-ad-slot={ADSENSE_SLOT}
			data-ad-format="auto"
			data-full-width-responsive="true"
		></ins>
	</aside>
{/if}

<style>
	.ad {
		margin-top: 1.25rem;
		min-height: 0;
	}
</style>
