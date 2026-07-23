<script lang="ts">
	import { chatParams } from "$lib/chatParams";
	import {
		messageDisplaySetting,
		messageInfo,
		messages,
	} from "$lib/messages";
	import { isLoading } from "$lib/stores";
	import { afterUpdate, onMount } from "svelte";
	import Counter from "./components/Counter.svelte";
	import InputForm from "./components/InputForm.svelte";
	import Messages from "./components/Messages.svelte";
	import ModalApiKey from "./components/ModalAPIKey.svelte";
	import ScrollProceedNextSection from "./components/ScrollProceedNextSection.svelte";
	import ScrollToBottomButton from "./components/ScrollToBottomButton.svelte";
	import {
		countTimeElapsed,
		enableSubmit,
		getUserAgentInfo,
		handleScroll,
		inFrame,
		initializeChat,
		isAtBottom,
		isInFrame,
		isLoaded,
		noAPIKeyProvided,
		scrolledUponSubmit,
		scrollToBottom,
		sendMessageToParent,
		sendMessageUntilReceived,
		toggleInputElementOpacity,
	} from "./utils";

	let nextSection: boolean = false;
	let scrollElement: HTMLDivElement;
	let nMessages = $messageInfo.nTotalMessages;

	$: if ($isLoading) toggleInputElementOpacity();

	// https://learn.svelte.dev/tutorial/update
	afterUpdate(() => {
		// scroll when there are new messages
		if (scrollElement && $messageInfo.nTotalMessages > nMessages) {
			// scroll 150px when streaming or when there are more than nInitialMessages + 2 messages (i.e., more than 2 message has been added since the initial messages)
			nMessages = $messageInfo.nTotalMessages;
			if (
				$chatParams.ui.stream ||
				$messages.length > $messageInfo.nInitialMessages + 1
			) {
				scrollElement.scrollBy(0, 150);
			} else {
				// scroll a bit when there are no messages or when there are only nInitialMessages messages
				// to ensure the scroll event is triggered and the app can check if the scroll is at the bottom
				scrollElement.scrollBy(0, 1);
			}
		}

		// scroll immediately upon submitting a message
		if ($scrolledUponSubmit && scrollElement) {
			scrollToBottom(scrollElement);
			scrolledUponSubmit.set(false); // reset to false after scrolling (will be set to true again upon submitting a message)
		}
	});

	$: if (!$enableSubmit) {
		// when the send/submit button for the input field has been disabled
		nextSection = true;
		sendMessageToParent($messages, nextSection);
		scrollToBottom(scrollElement);
		console.log("ENDING CHAT.");
	}

	onMount(() => {
		console.log("APP MOUNTED: =============================");
		countTimeElapsed();

		// listener function to handle messages from parent
		function handleMessage(event: MessageEvent) {
			initializeChat(scrollElement, nextSection, event);
		}

		getUserAgentInfo();
		isAtBottom.set(true);
		inFrame.set(isInFrame(window));

		if ($inFrame) {
			window.addEventListener("message", handleMessage);
			console.log("Running as iframe and requesting data from parent...");
			sendMessageUntilReceived(window);
		} else {
			console.log("Running as a standalone app (not iframe)");
			initializeChat(scrollElement, nextSection);
		}

		return () => {
			window.removeEventListener("message", handleMessage);
		};
	});
</script>

{#if $noAPIKeyProvided}
	<ModalApiKey />
{/if}

{#if $isLoaded}
	<main class="h-svh flex flex-col">
		<Counter />

		<div
			id="scrollElement"
			bind:this={scrollElement}
			on:scroll={handleScroll}
			class="w-full p-3 xs:p-8 xs:pl-12 xs:pr-12 pb-1 pt-3 mx-auto overflow-y-scroll no-scrollbar scroll-smooth mt-auto h-svh"
		>
			<Messages />
		</div>

		<div
			class={`relative w-[95%] md:w-[80%] pb-5 sm:pb-20 mx-auto grid grid-rows-[max-content_1fr]`}
		>
			{#if !$isAtBottom}
				<ScrollToBottomButton {scrollElement} />
			{/if}

			{#if $chatParams.appearance.showInputElement}
				{#if $enableSubmit}
					<InputForm {scrollElement} {nextSection} />
				{:else if !$enableSubmit && nextSection && $messageDisplaySetting.doneReading}
					<ScrollProceedNextSection />
				{/if}
			{/if}
		</div>
	</main>
{/if}
