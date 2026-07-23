<script lang="ts">
	import { page } from "$app/stores";
	import { onMount } from "svelte";
	import type { TestCase } from "./tests";
	import { generateDivId, handleJumpToSection } from "./utils";

	export let testCases: TestCase[];
	const testCaseTitles = testCases.map((testCase) => testCase.title);
	let idx: number;

	const hashchange = () => {
		idx = handleJumpToSection($page.url.hash, testCaseTitles);
	};

	onMount(() => {
		const hashExists = $page.url.hash !== "";
		if (hashExists) {
			setTimeout(() => {
				hashchange();
			}, 50);
		}
	});

	function handleClick(e: Event): void {
		const title = (e.target as HTMLSelectElement).value;
		const href = generateDivId(title);
		idx = handleJumpToSection(href, testCaseTitles);
	}
</script>

<svelte:window on:hashchange={hashchange} />

<select
	class="select select-sm max-w-sm bg"
	on:change|preventDefault={(e) => {
		handleClick(e);
	}}
>
	<!-- <option disabled selected>See test cases</option> -->
	{#each testCases as testCase, i}
		{#if i === idx}
			<option selected>{testCase.title}</option>
		{:else}
			<option>{testCase.title}</option>
		{/if}
	{/each}
</select>
