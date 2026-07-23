<script lang="ts">
	import bot from "$lib/icons/bot00.svg";
	import copy from "$lib/icons/copy.svg";
	import computer from "$lib/icons/computerCode.svg";
	import { apiKeyEncrypted } from "./stores";
	import {
		copyToClipboard,
		handleBotClick,
		handleRunCodeChunk,
	} from "./utils";

	export let testCaseString: string;
</script>

<div class="flex justify-center">
	<button
		class="btn btn-square btn-sm btn-block mt-1.5 ml-1"
		on:click|preventDefault={() => {
			handleBotClick(testCaseString, $apiKeyEncrypted, false);
			copyToClipboard(testCaseString);
		}}
	>
		<img src={bot} alt="Bot icon" title="Test chatbot" />
	</button>

	<button
		class="btn btn-square btn-sm btn-block mt-1.5 ml-1 border-4 border-purple-700"
		on:click|preventDefault={() => {
			handleBotClick(testCaseString, $apiKeyEncrypted, true);
			copyToClipboard(testCaseString);
		}}
	>
		<img src={bot} alt="Bot icon" title="Test iframe chatbot" />
	</button>
	<button
		class="btn btn-square btn-sm btn-block mt-1.5 ml-1 border-4"
		on:click|preventDefault={() => {
			copyToClipboard(testCaseString);
		}}
	>
		<img src={copy} alt="Copy icon" title="Copy" />
	</button>
	<button
		class="btn btn-square btn-sm btn-block mt-1.5 ml-1"
		on:click|preventDefault={() => {
			handleRunCodeChunk(testCaseString, $apiKeyEncrypted);
		}}
		><img
			src={computer}
			alt="Computer in console"
			title="Run code in console"
		/></button
	>
</div>
<br />
