<script lang="ts">
	import { onMount } from "svelte";
	import CodeChunk from "./CodeChunk.svelte";
	import ScrollToTop from "./ScrollToTop.svelte";
	import { apiKeyEncrypted } from "./stores";
	import { testCases } from "./tests";
	import TopMenu from "./TopMenu.svelte";
	import {
		getApiKeyEncryptedFromLocalStorage,
		insertApiKeyEncrypted,
	} from "./utils";

	let testCasesString: string[] = [];
	let isMounted: boolean = false;

	onMount(() => {
		if ($apiKeyEncrypted === "") {
			apiKeyEncrypted.set(getApiKeyEncryptedFromLocalStorage());
		}
		if ($apiKeyEncrypted) {
			console.log(`Use apiKeyEncrypted in stores: ${$apiKeyEncrypted}`);
		}
		testCases.forEach((testCase) => {
			testCasesString.push(
				insertApiKeyEncrypted(testCase.codeString, $apiKeyEncrypted),
			);
		});
		isMounted = true;
	});

	// Update testCasesString with updated apiKey when apiKeyEncrypted changes
	$: if (isMounted && $apiKeyEncrypted) {
		testCases.map((testCase, idx) => {
			testCasesString[idx] = insertApiKeyEncrypted(
				testCase.codeString,
				$apiKeyEncrypted,
			);
		});
		localStorage.setItem("apiKeyEncrypted", $apiKeyEncrypted);
	}
</script>

{#if isMounted}
	<main class="p-10 relative">
		<TopMenu {testCases} />
		<div class="mt-64 xs:mt-48 sm:mt-36 md:mt-32 z-0">
			{#each testCases as testCase, i}
				<CodeChunk {testCase} testCaseString={testCasesString[i]} />
			{/each}
		</div>

		<ScrollToTop />
	</main>
{/if}
