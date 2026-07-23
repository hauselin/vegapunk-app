<script lang="ts">
	import brush from "$lib/icons/brush.svg";
	import copyIcon from "$lib/icons/copyIcon.svg";
	import encryptIcon from "$lib/icons/encryptIcon.svg";
	import { encrypt } from "$lib/utils";
	import { onMount } from "svelte";

	let text: string = "";
	let ciphertext: string = "";
	let parentObj: any;

	onMount(() => {
		parentObj = localStorage.getItem("parentObj");
		if (parentObj) {
			parentObj = JSON.parse(parentObj);
			console.log(parentObj);
			ciphertext = parentObj.model.apiKeyEncrypted;
		}
	});

	const copyClipboard = (text: string): void => {
		if (navigator.clipboard) {
			navigator.clipboard.writeText(text);
		}
	};

	const clearBoxes = (e: Event): void => {
		e.preventDefault();
		text = "";
		ciphertext = "";
	};

	const handleEncrypt = async (e: Event): Promise<string> => {
		if (text === "") return "";
		e.preventDefault();
		ciphertext = await encrypt(text);
		return ciphertext;
	};

	// https://github.com/midhunhk/cryptx-web/blob/main/src/App.svelte
</script>

<main class="flex flex-col items-center justify-center h-screen mr-8">
	<div class="xs:w-[95%] sm:w-[70%]">
		<div class="join flex items-center m-5 w-full">
			<input
				class="input input-bordered join-item flex-grow"
				placeholder="API key"
				bind:value={text}
				name="text"
			/>
			<button
				class="btn join-item no-animation flex-shrink-0 w-auto xs:w-auto"
				on:click={handleEncrypt}
			>
				<span class="hidden xs:inline">Encrypt</span>
				<img
					class="w-5 h-5 xs:hidden"
					src={encryptIcon}
					alt="encrypt icon"
				/>
			</button>
			<button
				class="btn btn-neutral join-item no-animation flex-shrink-0 w-auto xs:w-auto"
				on:click|preventDefault={() => copyClipboard(text)}
			>
				<span class="hidden xs:inline">Copy</span>
				<img class="w-5 h-5 xs:hidden" src={copyIcon} alt="copy icon" />
			</button>
		</div>
	</div>

	<div class="xs:w-[95%] sm:w-[70%]">
		<div class="join flex items-center m-5 w-full">
			<input
				class="input input-bordered join-item flex-grow"
				placeholder="Encrypted API key"
				bind:value={ciphertext}
				name="ciphertext"
			/>

			<button
				class="btn btn-neutral join-item no-animation flex-shrink-0 w-auto xs:w-auto"
				on:click|preventDefault={() => copyClipboard(ciphertext)}
			>
				<span class="hidden xs:inline"
					>&nbsp;&nbsp;Copy&nbsp;&nbsp;</span
				>
				<img class="w-5 h-5 xs:hidden" src={copyIcon} alt="copy icon" />
			</button>
			<button
				class="btn btn-warning join-item no-animation flex-shrink-0 w-auto xs:w-auto border-0 bg-[#6766db]"
				on:click|preventDefault={clearBoxes}
			>
				<span class="hidden xs:inline text-white">Clear</span>
				<img class="w-5 h-5 xs:hidden" src={brush} alt="copy icon" />
			</button>
		</div>
	</div>
</main>
