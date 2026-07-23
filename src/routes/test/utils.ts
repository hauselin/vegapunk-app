import { pushState } from '$app/navigation';

export const cleanString = (str: string, apiKeyEncrypted: string): string => {
	let arr = str.split("\n");
	// remove first line, title line, and desc line, and last empty line
	let s = arr.slice(3, arr.length - 1);
	s = s.map((line) => {
		line = line.replace("  ", "").replace(`apiKeyEncrypted: ""`, `apiKeyEncrypted: "${apiKeyEncrypted}"`);
		return line
	});
	return s.join("\n");
}

export const createTestCase = (str: string) => {
	let arr = str.split("\n");
	const title = arr[1].replace("// title: ", "");
	const desc = arr[2].replace("// desc: ", "");
	const codeString = cleanString(str, "");
	return { title, desc, codeString };
};

export const insertApiKeyEncrypted = (str: string, apiKeyEncrypted: string): string => {
	return str.replace(`apiKeyEncrypted: ""`, `apiKeyEncrypted: "${apiKeyEncrypted}"`);
};

export const generateDivId = (title: string): string => {
	return title.replace(/\s+/g, "-").toLowerCase();
};

export const getApiKeyEncryptedFromLocalStorage = (): string => {
	return localStorage.getItem("apiKeyEncrypted") || "";
}


export const handleRunCodeChunk = (codeString: string, apiKeyEncrypted: string): void => {
	try {
		new Function("apiKeyEncrypted", codeString)(apiKeyEncrypted);
	} catch (e) {
		console.error(e);
		alert("Error running code chunk. " + e);
		return
	}
	console.log("Ran test function and updated parentObj in localStorage");
	console.log(codeString);
	const parentObj = localStorage.getItem("parentObj");
	parentObj && console.log(JSON.parse(parentObj));
};

export const handleBotClick = (codeString: string, apiKeyEncrypted: string, iframe: boolean): void => {
	handleRunCodeChunk(codeString, apiKeyEncrypted);
	let route: string = iframe ? "/frame" : "/";
	let newTab = window.open(route, "_blank");

	if (newTab) {
		newTab.onload = () => {
			newTab.window.console.log(
				"Ran test function and updated parentObj in localStorage",
			);
			newTab.window.console.log(codeString);
			const parentObj = localStorage.getItem("parentObj");
			parentObj && newTab.window.console.log(JSON.parse(parentObj));
		};
	} else {
		console.error("Failed to open new tab");
	}
};

export const handleBasicTest = (): void => {
	let parentObj = {
		model: {
			name: "gpt-3.5-turbo",
			apiKeyEncrypted: getApiKeyEncryptedFromLocalStorage(),
		},
		initialMessages: [],
		ui: { stream: true, assistantMessageOnLoad: false },
	};
	localStorage.setItem("parentObj", JSON.stringify(parentObj));
	console.log("Testing with parentObj:", parentObj);
};

export const handleJumpToSection = (href: string, testCaseTitles: string[]): number => {

	if (!href.includes("#")) href = "#" + href.toLowerCase();

	testCaseTitles = testCaseTitles.map(t => {
		t = "#" + generateDivId(t);
		return t;
	});

	// enable shallow routing
	try {
		pushState(href, href)  // allow back button to work
	} catch (e) { }

	// highlight the selected div
	const element = document.querySelector(href);
	if (element) element.scrollIntoView();
	element?.parentNode?.childNodes.forEach((child) => {
		if (child instanceof Element && child.nodeName === "DIV") {
			child?.classList?.remove("bg-blue-100", "p-4");
		}
	});
	element?.classList.add("bg-blue-100", "p-4");

	// scroll a little bit
	// if it's the final item, scroll to bottom
	const index = testCaseTitles.indexOf(href);
	if (index === testCaseTitles.length - 1) {
		window.scrollTo(0, document.body.scrollHeight);
	} else {
		window?.scrollBy(0, -250);
	}

	return index;
};

export const scrollToTop = (): void => {
	window.scrollTo({ top: 0 });
};

export function copyToClipboard(text: string) {
	navigator.clipboard.writeText(text);
}
