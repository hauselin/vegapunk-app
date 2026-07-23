<script lang="ts">
	import TestCasesMenu from "./TestCasesMenu.svelte";
	import { apiKeyEncrypted } from "./stores";
	import { handleBasicTest } from "./utils";
	import type { TestCase } from "./tests";

	export let testCases: TestCase[] = [];
	let placeHolderText: string = "";
	if (placeHolderText.length === 0)
		placeHolderText = "Provide encrypted API key";
	if ($apiKeyEncrypted.length !== 0) placeHolderText = $apiKeyEncrypted;
</script>

<div
	class="fixed inset-x-0 top-0 z-10 border-2 rounded bg-white shadow-md p-2 mx-10 mt-3"
>
	<div class="justify-center">
		<TestCasesMenu {testCases} />

		<button class="btn m-1 btn-sm justify-center"
			><a href="/crypto" target="_blank">Get encrypted key</a></button
		>
		<button class="btn m-1 btn-sm justify-center"
			><a href="/" target="_blank" on:click={handleBasicTest}
				>Test basic chatbot</a
			></button
		>
		<button
			class="btn m-1 btn-sm justify-center"
			on:click={() => {
				localStorage.removeItem("parentObj");
				console.log("Removed parentObj from localStorage");
			}}>Remove <code>parentObj</code></button
		>
		<button
			class="btn m-1 btn-sm justify-center"
			on:click={() => {
				localStorage.clear();
				console.log("Clear localStorage");
			}}>Clear <code>localStorage</code></button
		>

		<div class="m-1">
			<input
				type="text"
				placeholder={placeHolderText}
				bind:value={$apiKeyEncrypted}
				class="input input-bordered input-sm w-full"
			/>
		</div>
	</div>
</div>
