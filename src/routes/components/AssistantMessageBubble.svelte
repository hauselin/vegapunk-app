<script lang="ts">
    import type { ChatMessageType } from "$lib/chatParams";
    import { chatParams } from "$lib/chatParams";
    import bot from "$lib/icons/bot00.svg";
    import thumbsdown from "$lib/icons/thumbsdown.svg";
    import thumbsup from "$lib/icons/thumbsup.svg";
    import { isLoading } from "$lib/stores";
    import { marked } from "marked";

    export let message: ChatMessageType;
    export let index: number;
    export let handleClickThumbsup: (message: any) => void;
    export let handleClickThumbsdown: (message: any) => void;
    export let nMessages: number;

    let assistantClass = `prose chat-bubble max-w-[90%] ${$chatParams.appearance.showBotAvatar ? "ml-10" : "ml-0"} ${$chatParams.appearance.bubbleAssistantTextColor} ${$chatParams.appearance.bubbleAssistantBackground}`;
    let thumbsUpClass = `btn btn-xs ${$chatParams.appearance.voteButtonOpacity}`;
    let thumbsDownClass = `btn btn-xs  ${$chatParams.appearance.voteButtonOpacity}`;
    let highlightClass = "border-2 border-sky-500 hover:border-sky-500";
    let thumb: string = "";

    function handleClick(thumb: string) {
        if (thumb === "up") {
            handleClickThumbsup(message);
            thumbsDownClass = thumbsDownClass.replace(highlightClass, "");
            thumbsUpClass = `${thumbsUpClass} ${highlightClass}`;
        } else if (thumb === "down") {
            handleClickThumbsdown(message);
            thumbsUpClass = thumbsUpClass.replace(highlightClass, "");
            thumbsDownClass = `${thumbsDownClass} ${highlightClass}`;
        }
    }
    $: handleClick(thumb);
</script>

<div class="chat chat-start relative">
    {#if $chatParams.appearance.showBotAvatar}
        <div class="chat-image avatar indicator absolute top-2">
            {#if $isLoading && index === nMessages - 1}
                <span
                    class="indicator-item badge badge-warning bg-[#6766db] text-white text-xs"
                    >...</span
                >
            {/if}
            <div class="w-8 xs:w-10 rounded-full">
                <img alt="Assistant avatar" src={bot} />
            </div>
        </div>
    {/if}

    {#if $chatParams.ui.stream || !$isLoading || index < nMessages - 1}
        <div class={assistantClass}>
            {@html marked(message.content)}
        </div>
    {:else if !$chatParams.ui.stream && $isLoading && index === nMessages - 1}
        <div class={`chat-bubble ml-10 text-black bg-white`}></div>
    {/if}

    {#if $chatParams.study.showVoteButtons}
        {#if index < nMessages - 1 || (index === nMessages - 1 && !$isLoading)}
            <div class="chat-footer ml-14">
                <button
                    on:click|preventDefault={() => {
                        thumb = "up";
                    }}
                    class={thumbsUpClass}
                >
                    <img class="w-5 h-5" alt="thumbsup" src={thumbsup} />
                </button>
                <button
                    on:click|preventDefault={() => {
                        thumb = "down";
                    }}
                    class={thumbsDownClass}
                >
                    <img class="w-5 h-5" alt="thumbsdown" src={thumbsdown} />
                </button>
            </div>
        {/if}
    {/if}
</div>
