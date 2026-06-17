<script lang="ts">
	import { OG_IMAGE, SITE_NAME, SITE_URL } from '$lib/seo';

	interface Props {
		title: string;
		description: string;
		/** Caminho da rota começando com "/" (ex.: "/", "/jogo"). */
		path: string;
		image?: string;
	}

	let { title, description, path, image = OG_IMAGE }: Props = $props();

	// Evita barra dupla na home ("/" + "" = "/").
	const canonical = $derived(`${SITE_URL}${path === '/' ? '' : path}` || SITE_URL);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:locale" content="pt_BR" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={image} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />
</svelte:head>
