<script lang="ts">
	import type { ChatMessageType } from "$lib/chatParams";
	import { chatParams } from "$lib/chatParams";
	export let message: ChatMessageType;
</script>

<div class="chat chat-end">
	<div class={`chat-bubble ml-10 ${$chatParams.appearance.bubbleUserBackground} ${$chatParams.appearance.bubbleUserTextColor}`}>
		{@html message.content}
	</div>
</div>
