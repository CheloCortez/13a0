<script lang="ts">
	let { data }: { data: Record<string, unknown> } = $props();
</script>

<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html `<script type="application/ld+json">${JSON.stringify(data)}</` + `script>`}
</svelte:head>
