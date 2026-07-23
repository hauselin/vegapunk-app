<script lang="ts">
	import up from "$lib/icons/up.svg";
	import { scrollToTop } from "./utils";
</script>

<div class="fixed bottom-3 left-0 w-full flex justify-center">
	<button class="btn btn-circle btn-sm" on:click|preventDefault={scrollToTop}>
		<img src={up} alt="scroll up" />
	</button>
</div>
