<script lang="ts">
	import Frame from "./Frame.svelte";
	import { page } from "$app/stores";

	// let src = "https://sveltekit-vercel-chatbot.vercel.app/";
	//let src = "https://iframetester.com/";
	let src = $page.url.host;
	if (src.includes("localhost")) {
		src = `http://${src}`;
	} else {
		src = `https://${src}`;
	}
</script>

<main class="border-8 border-sky-500">
	<Frame {src} />
</main>
