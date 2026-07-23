<script lang="ts">
	import type { ChatMessageType } from "$lib/chatParams";
	export let message: ChatMessageType;
</script>

<div class="chat chat-start flex justify-center">
	<div class=" bg-red-800 text-white p-2 px-4 border rounded-xl">
		{@html message.content}
	</div>
</div>
