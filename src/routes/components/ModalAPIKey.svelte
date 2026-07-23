<script lang="ts">
	import { onMount } from "svelte";
	import { encrypt } from "$lib/utils";

	let text: string = "";
	let ciphertext: string = "";
	let modal: HTMLDialogElement;

	onMount(() => {
		modal = document.getElementById("apiKeyModal") as HTMLDialogElement;
		modal?.showModal();
	});

	const handleEncrypt = async (e: Event): Promise<string> => {
		if (text === "") return "";
		e.preventDefault();
		ciphertext = await encrypt(text);

		let parentObj: any = localStorage.getItem("parentObj");
		if (parentObj) {
			parentObj = JSON.parse(parentObj);
			console.log(parentObj);
			parentObj.model.apiKeyEncrypted = ciphertext;
		} else {
			parentObj = {
				model: { apiKeyEncrypted: ciphertext, name: "gpt-4-turbo" },
			};
		}
		localStorage.setItem("parentObj", JSON.stringify(parentObj));
		location.reload();
		return ciphertext;
	};
</script>

<dialog id="apiKeyModal" class="modal">
	<div class="modal-box">
		<form method="dialog">
			<button
				class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
				>✕</button
			>
		</form>
		<p class="text-md flex justify-center">Provide your OpenAI API key.</p>
		<div class="join mt-4 w-full">
			<input
				class="input input-bordered join-item w-full"
				placeholder="Enter key"
				bind:value={text}
			/>
			<button on:click={handleEncrypt} class="btn join-item"
				>Submit</button
			>
		</div>
	</div>
</dialog>
