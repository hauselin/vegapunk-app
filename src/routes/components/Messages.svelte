<script lang="ts">
	import type { ChatMessageType } from "$lib/chatParams";
	import { chatParams } from "$lib/chatParams";
	import { addEmptyAIMessage, messages } from "$lib/messages";
	import { highlightedStrings, isLoading, thumbs } from "$lib/stores";
	import { marked } from "marked";
	import AssistantMessageBubble from "./AssistantMessageBubble.svelte";
	import SystemMessageBubble from "./SystemMessageBubble.svelte";
	import UserMessageBubble from "./UserMessageBubble.svelte";

	// when not streaming (generating text), add a blank message to pretend AI is typing/thinking
	// when streaming, add a blank message only if online search is enabled (because internet search is slow and doesn't use streaming)
	$: if (
		(!$chatParams.ui.stream && $isLoading) ||
		($chatParams.ui.stream &&
			$isLoading &&
			$chatParams.study.enableOnlineSearch > 0)
	) {
		addEmptyAIMessage();
	}

	const handleClickThumbsup = (message: ChatMessageType) => {
		updateMessageThumb(message, "up");
	};

	const handleClickThumbsdown = (message: ChatMessageType) => {
		updateMessageThumb(message, "down");
	};

	const updateMessageThumb = (message: ChatMessageType, thumb: string) => {
		message.thumb = thumb;
		message.thumbAt = new Date();
		thumbs.update((x) => [...x, message]);
	};

	// $: console.log($thumbs);

	const handleClick = (e: Event) => {
		//TODO: This haven't been used for a while, should we get rid of it?
		//TAWAB-QUESTION: handleClick is never used in the code, should we remove it?
		// unselect the highlighted text and remove <mark> tag
		if (!(e.target instanceof HTMLElement)) {
			return false;
		}
		const targetElement = e.target as HTMLElement;
		targetElement.outerHTML = targetElement.innerText;
		targetElement.style.backgroundColor = "transparent";
		const updated = $highlightedStrings.filter(
			(str) => str !== targetElement.innerText,
		);
		highlightedStrings.update(() => updated);
		console.log($highlightedStrings);
	};

	const handleMouseUp = (e: Event) => {
		// TAWAB-QUESTION - needs to understand how this function works
		// Ensure e.target is not null and is an instance of Element
		if (!(e.target instanceof Element)) {
			return false;
		}

		if (!$chatParams.study.allowTextHighlight || !e.target.matches("p")) {
			return false;
		}

		const selection = document.getSelection();
		const selectedString = selection?.toString() || "";

		if (selection && selectedString.length > 3) {
			const range = selection.getRangeAt(0);
			// if has tagname, then it's not a text node (only highlight text nodes)
			// console.log(range);
			if (
				range.startContainer instanceof Text &&
				range.endContainer instanceof Text &&
				range.commonAncestorContainer instanceof Text
			) {
				const mark = document.createElement("mark");
				mark.style.backgroundColor = "pink";
				// mark.onclick = handleClick;
				range.surroundContents(mark);
			} else if (
				range.commonAncestorContainer.nodeType == Node.ELEMENT_NODE
			) {
				// create a new html node with new innerhtml
				const range_element =
					range.commonAncestorContainer as HTMLElement;
				let innerHTML = range_element.innerHTML;
				const clone = range.cloneContents();
				const tempDiv = document.createElement("div");
				tempDiv.appendChild(clone);
				const selectedHTML = tempDiv.innerHTML;
				let newText = `<mark style="background-color:pink">${selectedHTML}</mark>`;

				innerHTML = innerHTML.replace(selectedHTML, newText);
				range_element.innerHTML = innerHTML;
				// range.onclick = handleClick;
				range.deleteContents();
			}

			// range.deleteContents();
			highlightedStrings.update((x) => {
				// remove overlapping strings
				x = x.filter((str) => !selectedString.includes(str));
				return [...x, selectedString];
			});

			selection.removeAllRanges();
			// console.log($highlightedStrings);
		}
	};
	// $: console.log($highlightedStrings);

	// setup marked/markdown renderer to open links in messages in new tab/window
	const renderer = new marked.Renderer();

	const cleanUrl = (href: string): string | null => {
		try {
			href = encodeURI(href).replace(/%25/g, "%");
		} catch (e) {
			return null;
		}
		return href;
	};

	renderer.link = (href, title, text) => {
		const cleanHref = cleanUrl(href);
		if (cleanHref === null) {
			return text;
		}
		let out = '<a target="_blank" href="' + cleanHref + '"';
		if (title) {
			out += ' title="' + title + '"';
		}
		out += ">" + text + "</a>";
		return out;
	};

	marked.setOptions({
		renderer: renderer,
	});
</script>

<svelte:window on:mouseup={handleMouseUp} />

{#each $messages as message, index}
	{#if !message.hideInitialMessage}
		{#if message.role === "assistant"}
			<AssistantMessageBubble
				{message}
				{index}
				nMessages={$messages.length}
				{handleClickThumbsup}
				{handleClickThumbsdown}
			/>
		{:else if message.role === "user"}
			<UserMessageBubble {message} />
		{:else if message.role === "system"}
			<SystemMessageBubble {message} />
		{/if}
	{/if}
{/each}
