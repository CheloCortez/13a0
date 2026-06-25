<script lang="ts">
	let { data }: { data: Record<string, unknown> } = $props();

	// Escapa o caractere "menor que" para impedir que um valor encerre a tag de script
	// prematuramente. Usamos String.fromCharCode(60) em vez do caractere literal para
	// não confundir o parser do Svelte, que o leria como início de tag.
	const json = $derived(JSON.stringify(data).split(String.fromCharCode(60)).join('\\u003c'));
</script>

<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html `<script type="application/ld+json">${json}</` + `script>`}
</svelte:head>
