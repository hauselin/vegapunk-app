<script lang="ts">
	import down from "$lib/icons/down.svg";
	import { scrollToBottom } from "../utils";
	export let scrollElement: HTMLDivElement;
</script>

<div class="toast toast-center absolute top-0 -translate-y-12">
	<button
		on:click={() => scrollToBottom(scrollElement)}
		class="btn btn-sm btn-circle"
		><img src={down} alt="scroll down" class="w-7 h-7" /></button
	>
</div>
