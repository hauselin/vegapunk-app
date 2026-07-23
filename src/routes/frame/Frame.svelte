<script lang="ts">
	import { onMount } from "svelte";

	export let src;
	let width = "95%";
	let height = "100vh";
	let title = "";
	let id = "frame";

	let childFrame: any;

	onMount(() => {
		function handleMessage(e: MessageEvent) {
			let appData;
			try {
				appData = JSON.parse(e.data);
				if (!appData.requestData) {
					return;
				}
			} catch (error) {
				return;
			}

			const parentObj = localStorage.getItem("parentObj");
			// send parentObj to childFrame, only if parentObj exists
			if (childFrame && childFrame.contentWindow && parentObj) {
				console.log(
					"qualtrics (mock): sending chatParamsJson to iframe",
				);
				childFrame.contentWindow.postMessage(parentObj, "*");
			}

			// if (appData.nextSection) {
			// 	console.log("Allow next section button");
			// }
		}

		const updateHeight = () => {
			height = `${window.innerHeight - 15}px`;
		};

		updateHeight();
		window.addEventListener("resize", updateHeight);
		window.addEventListener("message", handleMessage);

		return () => {
			window.removeEventListener("resize", updateHeight);
			window.removeEventListener("message", handleMessage);
		};
	});
</script>

<iframe
	bind:this={childFrame}
	{id}
	{src}
	{width}
	{height}
	{title}
	frameborder="0"
	allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
	allowfullscreen
	class="m-0 p-0 border-0"
></iframe>
