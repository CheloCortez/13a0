<script lang="ts">
	import '../app.css';
	import { base } from '$app/paths';
	import { dev } from '$app/environment';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

	// Amostra eventos de analytics para conter volume em picos de tráfego (15k+ simultâneos),
	// mantendo Speed Insights (Web Vitals) integral.
	const ANALYTICS_SAMPLE = 0.2;
	injectAnalytics({
		mode: dev ? 'development' : 'production',
		beforeSend: (event) => (Math.random() < ANALYTICS_SAMPLE ? event : null)
	});
	injectSpeedInsights();

	let { children } = $props();
</script>

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<header>
	<nav>
		<a class="logo" href="{base}/">
			<span class="mark" aria-hidden="true">13<i>:</i>0</span>
			<span class="wordmark">Treze a Zero</span>
		</a>
		<a class="nav-link" href="{base}/sobre">Como jogar</a>
		<a class="nav-link" href="{base}/contato">Contato</a>
	</nav>
</header>

<main>
	{@render children()}
</main>

<style>
	header {
		position: sticky;
		top: 0;
		z-index: 10;
		background: linear-gradient(180deg, #131a24, #0f151d);
		border-bottom: 1px solid var(--border);
		box-shadow: 0 6px 18px -10px rgba(0, 0, 0, 0.8);
	}

	/* Filete laranja no topo, marca registrada da HLTV */
	header::before {
		content: '';
		display: block;
		height: 3px;
		background: linear-gradient(90deg, var(--accent-dark), var(--accent) 35%, var(--accent-bright) 50%, var(--accent) 65%, var(--accent-dark));
	}

	nav {
		max-width: 700px;
		margin: 0 auto;
		padding: 0.55rem clamp(0.85rem, 3vw, 1.25rem);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.logo {
		display: inline-flex;
		align-items: baseline;
		gap: 0.55rem;
		text-decoration: none;
		color: var(--text);
	}

	.mark {
		font-family: var(--font-display);
		font-size: 1.45rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		line-height: 1;
		padding: 0.18rem 0.5rem 0.1rem;
		background: var(--panel-2);
		box-shadow: inset 0 0 0 1px var(--border-strong);
		clip-path: polygon(var(--cut-sm) 0, 100% 0, 100% calc(100% - var(--cut-sm)), calc(100% - var(--cut-sm)) 100%, 0 100%, 0 var(--cut-sm));
	}

	.mark i {
		font-style: normal;
		color: var(--accent);
		margin: 0 0.06em;
	}

	.wordmark {
		font-family: var(--font-display);
		font-size: 0.78rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.22em;
		color: var(--muted);
	}

	.nav-link {
		font-family: var(--font-display);
		font-size: 0.82rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--muted);
		text-decoration: none;
		padding: 0.3rem 0;
		border-bottom: 2px solid transparent;
		transition: color 0.15s, border-color 0.15s;
	}

	.nav-link:hover {
		color: var(--accent-bright);
		border-bottom-color: var(--accent);
	}

	@media (max-width: 420px) {
		.wordmark {
			display: none;
		}
	}
</style>
