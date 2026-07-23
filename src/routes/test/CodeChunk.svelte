<script lang="ts">
	import { onMount } from "svelte";
	import RunButtons from "./RunButtons.svelte";
	import { apiKeyEncrypted } from "./stores";
	import type { TestCase } from "./tests";
	import { generateDivId } from "./utils";

	export let testCase: TestCase;
	export let testCaseString: string;
	export let updatedValue = testCaseString;
	export let minRows = 1;
	export let maxRows = 21;

	let textarea: HTMLTextAreaElement;
	let lineHeight: number;

	function computeLineHeight() {
		const computedStyle = getComputedStyle(textarea);
		lineHeight =
			computedStyle.lineHeight === "normal"
				? parseInt(computedStyle.fontSize) * 1.2
				: parseInt(computedStyle.lineHeight);
	}

	let isMounted = false;
	onMount(() => {
		isMounted = true;
		computeLineHeight();
		adjustHeight();
	});

	function adjustHeight() {
		const currentHeight = textarea.style.height;
		textarea.style.height = "auto";
		const scrollHeight = textarea.scrollHeight;
		textarea.style.height = currentHeight;
		const newHeight = Math.min(
			Math.max(scrollHeight, minRows * lineHeight),
			maxRows * lineHeight,
		);
		textarea.style.height = `${newHeight}px`;
	}

	$: if (isMounted && $apiKeyEncrypted) {
		computeLineHeight();
		adjustHeight();
		updatedValue = textarea.value;
	}

	function handleInput(event: Event) {
		event.preventDefault();
		computeLineHeight();
		adjustHeight();
		updatedValue = textarea.value;
	}
</script>

<div class="divider mt-8">
	<span class="font-bold">{@html testCase.title}</span>
</div>

{#key testCaseString}
	<div id={generateDivId(testCase.title)}>
		{@html testCase.desc}
		<textarea
			bind:this={textarea}
			value={testCaseString}
			on:input={handleInput}
			id="message"
			rows={minRows}
			class="block p-2.5 w-full text-sm my-1 text-gray-200 bg-gray-700 rounded-md overflow-x-auto whitespace-pre-wrap"
			placeholder=""
			spellcheck="false"
		></textarea>
		<RunButtons testCaseString={updatedValue} />
	</div>
{/key}
