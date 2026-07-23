<script lang="ts">
	import { chatParams } from "$lib/chatParams";
	import { isLoading } from "$lib/stores";
	import { onDestroy } from "svelte";
	import { timeStart } from "../utils";
	import { messageInfo } from "$lib/messages";

	let elapsed = 0;
	let lastTime = 0;

	let timer = setInterval(() => {
		if ($timeStart !== 0) {
			const time = window.performance.now() / 1000;
			elapsed += Math.min(
				time - lastTime,
				$chatParams.study.maxTime - elapsed,
			);
			lastTime = time;
		} else {
			lastTime = window.performance.now() / 1000;
		}
	}, 1000);

	onDestroy(() => {
		clearInterval(timer);
	});

	function generateMessageCounterText(): string {
		let messageCounterText = "";

		if ($chatParams.ui.showMessageCount !== "none") {
			let messageCount = $messageInfo.nNonInitialMessages;
			messageCount = messageCount < 0 ? 0 : messageCount;

			// add 1 to message count if loading (to account for the latest user input/message)
			if ($isLoading) messageCount += 1;

			if ($chatParams.ui.showMessageCount === "total") {
				messageCounterText = `Message count: ${messageCount}`;
			} else if ($chatParams.ui.showMessageCount === "remain") {
				let messagesRemain =
					$chatParams.study.maxUserMessages * 2 - messageCount;
				messagesRemain = messagesRemain < 0 ? 0 : messagesRemain;
				messageCounterText = `Messages remaining: ${messagesRemain}`;
			}
		}

		return messageCounterText;
	}

	let messageCounterText = "";
	$: if ($messageInfo) messageCounterText = generateMessageCounterText();

	function generateTimerCounterText(elapsed: number): string {
		let timerCounterText = "";

		if ($chatParams.ui.showTimer !== "none") {
			if ($chatParams.ui.showTimer === "remain") {
				const timeLeft = $chatParams.study.maxTime - elapsed;
				const timeLeftSec = Math.max(0, Math.ceil(timeLeft));
				if (timeLeft == Infinity) {
					timerCounterText = "Time left: Infinity";
				} else if (timeLeftSec <= 0) {
					timerCounterText = "Time left: 0s";
				} else {
					timerCounterText = `Time left: ${timeLeftSec}s`;
				}
			} else if ($chatParams.ui.showTimer === "elapsed") {
				const minutes = Math.floor(elapsed / 60);
				const seconds = (elapsed % 60).toFixed(0).padStart(2, "0");
				timerCounterText = `Time elapsed: ${minutes}:${seconds}`;
			}
		}
		return timerCounterText;
	}

	let timerCounterText = "";
	$: timerCounterText = generateTimerCounterText(elapsed);

	let counterText = "";
	$: if (messageCounterText && timerCounterText) {
		counterText = `${messageCounterText} | ${timerCounterText}`;
	} else if (messageCounterText) {
		counterText = messageCounterText;
	} else if (timerCounterText) {
		counterText = timerCounterText;
	}
</script>

{#if counterText}
	<div class="fixed inset-x-0 z-10 flex justify-center">
		<div
			class=" bg-slate-50 shadow-sm mt-1 p-1 px-4 border rounded-xl text-xs text-slate-500"
		>
			{counterText}
		</div>
	</div>
{/if}
