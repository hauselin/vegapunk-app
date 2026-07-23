<script lang="ts">
    import { chatParams } from "$lib/chatParams";
    import {
        messageDisplaySetting,
        messageInfo,
        messages,
        userInput,
    } from "$lib/messages";
    import { isLoading } from "$lib/stores";
    import DOMPurify from "isomorphic-dompurify";
    import {
        checkAtBottom,
        continueScroll,
        countMessagesAndTime,
        disableInputElement,
        enableSubmit,
        getScrollElement,
        inputElementOpacity,
        isAtBottom,
        receivedParentMessage,
        scrolledUponSubmit,
        handleChatInteraction,
        sendMessageToParent,
        timeStart,
        userSentMessage,
    } from "../utils";

    export let scrollElement: HTMLDivElement;
    export let nextSection: boolean;

    const submit = async (e: Event) => {
        if ($chatParams.study.sanitize) {
            userInput.set(DOMPurify.sanitize($userInput));
        }
        if ($userInput === "") {
            return;
        }
        e.preventDefault();
        scrolledUponSubmit.set(true); // to trigger scroll to bottom upon submit

        // determine if the user has sent at least one message and record the time
        if (!$userSentMessage) {
            userSentMessage.set(true);
            timeStart.set(new Date().getTime());
        }

        scrollElement = getScrollElement(scrollElement);
        receivedParentMessage.set(true);
        isAtBottom.set(checkAtBottom(scrollElement));
        isLoading.set(true);
        continueScroll.set(true);

        messageDisplaySetting.update((x) => {
            return { ...x, nWords: 0 };
        });

        if ($chatParams.ui.stream) {
            let messageDisplayStartTime: number = new Date().getTime();
            messageDisplaySetting.update((x) => {
                return { ...x, messageDisplayStartTime };
            });
        }

        console.log(
            `\n\nSTART: =============================\n${new Date().toISOString()}\nSend API request`,
        );
        sendMessageToParent($messages, nextSection);
        countMessagesAndTime($messages);
        handleChatInteraction(false, $userInput, scrollElement, nextSection);
        $userInput = "";

        isAtBottom.set(checkAtBottom(scrollElement));
    };

    const stopRequest = (e: Event) => {
        e.preventDefault();
        sendMessageToParent($messages, nextSection);
        isLoading.set(false);
        messageDisplaySetting.update((x) => {
            return { ...x, doneReading: true };
        });
        enableSubmit.set(false);
    };

    const preventPaste = (e: Event) => {
        if ($chatParams.ui.preventPaste) {
            e.preventDefault();
        }
    };
</script>

<form on:submit|preventDefault={submit}>
    <div class="join flex justify-center pt-2">
        <input
            class={`input input-bordered join-item w-full ${$inputElementOpacity}`}
            placeholder={$chatParams.appearance.placeHolderInputText}
            disabled={$disableInputElement}
            bind:value={$userInput}
            on:paste={preventPaste}
        />
        {#if $isAtBottom && !$isLoading}
            <button class="btn join-item rounded-r-lg" type="submit"
                >Send</button
            >
        {/if}

        {#if $messageInfo.nUserMessages >= $chatParams.study.allowStopAfterNUserMessages || $chatParams.study.allowStopAfterNUserMessages === 0}
            <button
                on:click|preventDefault={stopRequest}
                class="btn join-item rounded-r-lg bg-slate-300">Stop</button
            >
        {/if}
    </div>
</form>
