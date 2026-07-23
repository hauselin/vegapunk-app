
import type { ChatMessageType, ChatParamsType } from "$lib/chatParams";
import { chatParams, updateChatParams } from "$lib/chatParams";
import { addAIMessage, addUserMessage, countMessages, initialMessages, messageDisplaySetting, messageInfo, messages, processInitialMessages, type MessageInfoType } from "$lib/messages";
import { allowedOrigins, highlightedStrings, isLoading, thumbs } from "$lib/stores";
import { tick } from "svelte";
import { get, writable, type Writable } from "svelte/store";
import type { IResult } from "ua-parser-js";
import { UAParser } from "ua-parser-js";

interface UserAgentInfoType {
    client: any;
}

export interface DataItemType {
    userAgentInfo: any;
    // Add other properties as needed
}

// Local Utils variables:
export const scrolledUponSubmit: Writable<boolean> = writable(false);
export const inFrame: Writable<boolean> = writable(false);
export const noAPIKeyProvided: Writable<boolean> = writable(false);
export const lastScrollTop: Writable<number> = writable(0);
// Stores for managing scroll states:
export const continueScroll: Writable<boolean> = writable(true);
export const isAtBottom: Writable<boolean> = writable(false);
export const inputElementOpacity: Writable<string> = writable("opacity-100");
export const disableInputElement: Writable<boolean> = writable(false);
export const enableSubmit: Writable<boolean> = writable(true);
export const timeNow: Writable<number> = writable(new Date().getTime());
// keep track of whether user has sent at least one message
export const userSentMessage: Writable<boolean> = writable(false);
export const timeStart: Writable<number> = writable(0);  // or new Date().getTime()

export const timeReceivedResponse: Writable<number> = writable(0);
export const receivedParentMessage: Writable<boolean> = writable(false);
export const isLoaded: Writable<boolean> = writable(false);

export const userAgentInfo = writable<UserAgentInfoType>({
    client: {},
});


export function getUserAgentInfo(): void {

    let userAgentClient = new UAParser();
    const uaClientInfo = userAgentClient.getResult() as IResult & {
        size?: { width: number; height: number };
        mobile?: boolean;
    };
    uaClientInfo.size = {
        width: window.innerWidth,
        height: window.innerHeight,
    };
    uaClientInfo.mobile = window.innerWidth < 640;
    userAgentInfo.update((x) => {
        return { ...x, client: uaClientInfo };
    });
}

export function toggleInputElementOpacity(): void {
    if (get(isLoading)) {
        inputElementOpacity.set("opacity-55");
        disableInputElement.set(true);
    } else {
        inputElementOpacity.set("opacity-100");
        disableInputElement.set(false);
    }
}


// Scroll Functions
export function getScrollElement(node: HTMLDivElement | null): HTMLDivElement {
    // scrollElement is null/undefined when the app is first mounted because the element has not been rendered yet (due to isLoaded being updated later in the lifecycle)
    // this function/check is needed to ensure scrollElement is not null/undefined for many functions downstream!!!

    if (!node) {
        node = document.getElementById(
            "scrollElement",
        ) as HTMLDivElement;
    }
    return node;
}

export function checkAtBottom(node: HTMLElement): boolean {
    if (!node) {
        node = getScrollElement(node);
    }
    if (!node) return true;

    // add extra pixels to the scrollHeight to account for rounding errors
    const atBottom = node.scrollTop + node.clientHeight + 10 >= node.scrollHeight;

    // log only for debugging purposes
    const debug = false
    if (debug) {
        console.log(node);
        console.log(`scrollTop: ${node.scrollTop}, clientHeight: ${node.clientHeight}, scrollHeight: ${node.scrollHeight}, scrollTop + scrollHeight: ${node.scrollTop + node.clientHeight}`)
        console.log("atBottom:", atBottom)
    }

    return atBottom;
}

export function handleScroll(e: Event) {
    const node = e.target as HTMLDivElement;
    if (get(isLoading)) {
        // if is loading, scroll should never be considered at bottom, so disable input element
        isAtBottom.set(false);
        toggleInputElementOpacity();
    } else {
        if (checkAtBottom(node)) {
            // if not loading and at bottom, then enable input element
            isAtBottom.set(true);
            toggleInputElementOpacity();
        } else {
            // if not loading but not at bottom, then user has scrolled up, so disable input element
            isAtBottom.set(false);
            inputElementOpacity.set("opacity-55");
            disableInputElement.set(true);
        }
    }
};


// https://svelte.dev/repl/937a3a035a1f41178714cd7e2e21ca7a?version=3.48.0
export const scrollToBottom = async (node: HTMLDivElement) => {
    node = getScrollElement(node);
    node.scroll({ top: node.scrollHeight, behavior: "smooth" });
    // add extra pixels to ensure fully scrolled to bottom
    node.scrollTop = node.scrollTop += 10000;
    isAtBottom.set(true);
};


export const isScrollbarVisible = (node: HTMLDivElement) => {
    node = getScrollElement(node);
    if (node) return node.scrollHeight > node.clientHeight;
};


export const sleep = (seconds: number) => {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};



export async function sendMessageUntilReceived(window: Window) {
    let nMessageAttempts = 0;
    while (!get(receivedParentMessage)) {
        nMessageAttempts = nMessageAttempts + 1;
        console.log(
            `Sending/requesting message to/from parent (${nMessageAttempts})...`,
        );
        const message = JSON.stringify({ requestData: true });
        window.parent.postMessage(message, "*");
        await sleep(1);
    }
}


export function isInFrame(window: Window): boolean {
    return typeof parent !== "undefined" && parent !== window;
}


export function countTime(): void {
    timeNow.set(new Date().getTime());
    let currentTime: number = get(timeNow);
    const timeElapsed = (currentTime - get(timeStart)) / 1000;
    if (timeElapsed >= get(chatParams).study.maxTime && get(userSentMessage)) {
        enableSubmit.set(false);
    }
}

export async function countTimeElapsed() {
    while (get(enableSubmit)) {
        countTime();
        await sleep(2);  // check every 2 seconds to determine whether to disable submit button
    }
}

export function countMessagesAndTime(messages: ChatMessageType[]): void {
    countMessages(messages);
    countTime();
};


export async function showButtonAfterDelay(stream: boolean = true, messages: ChatMessageType[]): Promise<void> {
    let timeLeft: number;
    let { nWords,
        messageDisplayDuration,
        messageDisplayStartTime,
        avgWordsPerSec,
        avgSecondsPerWord,
        minReadingTime,
        doneReading } = get(messageDisplaySetting);

    if (stream) {
        messageDisplayDuration = (new Date().getTime() - messageDisplayStartTime) / 1000;
        timeLeft = minReadingTime - messageDisplayDuration;
        messageDisplaySetting.update((val) => {
            return { ...val, messageDisplayDuration };
        });
    } else {
        doneReading = false;
        messageDisplaySetting.update((val) => {
            return { ...val, doneReading }
        });
        console.log("$message2", messages);
        nWords = messages[messages.length - 1].content.split(" ").length;
        messageDisplaySetting.update((val) => {
            return { ...val, nWords };
        });
        minReadingTime = avgSecondsPerWord * nWords;
        timeLeft = minReadingTime;
        messageDisplaySetting.update((val) => {
            return { ...val, minReadingTime };
        });
    }
    timeLeft = timeLeft * 1000;
    if (timeLeft < 0) timeLeft = 0;
    console.log(
        `Expected reading time: ${Math.round(minReadingTime * 1000)}ms. Waiting time: ${Math.round(timeLeft)}ms`,
    );
    await tick();
    await new Promise((resolve) => setTimeout(resolve, timeLeft));
    messageDisplaySetting.update((val) => {
        return { ...val, doneReading: true }
    });
    console.log("Expected reading time over");
}

function prepareParentMessage(
    messages: ChatMessageType[],
    nextSection: boolean,
): string {

    let messageForParent: { messages: ChatMessageType[], userAgentInfo: UserAgentInfoType, thumbs: any[], highlightedStrings: string[], messageInfo: MessageInfoType, nextSection: boolean } = {
        messages: [],
        userAgentInfo: get(userAgentInfo).client,
        thumbs: get(thumbs),
        highlightedStrings: get(highlightedStrings),
        messageInfo: get(messageInfo),
        nextSection,
    };

    let firstMessageTime = new Date(messages[0].createdAt || Date.now());
    let chatHistoryProcessed: any[] = [];
    messages.forEach((message, idx: number) => {
        const messageTime = new Date(message.createdAt || Date.now());
        const timeElapsedInSeconds = (messageTime.getTime() - firstMessageTime.getTime()) / 1000;
        chatHistoryProcessed.push({ role: message.role, content: message.content, createdAt: timeElapsedInSeconds, id: idx })
    });
    messageForParent.messages = chatHistoryProcessed;

    // stringify messageForParent and split into smaller chunks
    let messageForParentString = JSON.stringify(messageForParent);
    let messageForParentStringSplitArray: string[] = []
    const chunkSizeCharacter = 19000;  // qualtrics text input limit is 20000 characters
    for (let i = 0; i < messageForParentString.length; i += chunkSizeCharacter) {
        messageForParentStringSplitArray.push(messageForParentString.substring(i, i + chunkSizeCharacter));
    }

    messageForParentString = JSON.stringify(messageForParentStringSplitArray);
    console.log(`Sending message to parent (${messageForParentStringSplitArray.length} messages chunks, ${messageForParentString.length} characters total)`, messageForParent);

    return JSON.stringify(messageForParentStringSplitArray);
}



export function sendMessageToParent(
    messages: ChatMessageType[],
    nextSection: boolean,
) {
    if (messages.length === 0) return;  // no messages to send to parent
    let parentMessage = prepareParentMessage(messages, nextSection);
    window.parent.postMessage(parentMessage, "*");
}


export function handlePostChat(
    allMessages: ChatMessageType[],
    nextSection: boolean,
    scrollElement: HTMLDivElement,
): void {

    if (get(chatParams).ui.showInputBasedOnReadingTime && get(chatParams).ui.stream) {
        showButtonAfterDelay(true, allMessages);
    } else {
        messageDisplaySetting.update((x) => { return { ...x, doneReading: true }; });
    }

    if (checkAtBottom(scrollElement)) {
        isAtBottom.set(true);
    }

    if (get(isAtBottom)) {
        toggleInputElementOpacity();
    }

    if (get(inFrame)) {
        console.log("Received AI response. Message parent.");
        sendMessageToParent(allMessages, nextSection);
    } else {
        console.log("Received AI response.");
    }

    countMessagesAndTime(allMessages);
    logMessageTypeCount(allMessages);
    console.log('messages:', allMessages);
    console.log('END: ====================================\n\n');
}



function logMessageTypeCount(messages: ChatMessageType[]): void {

    const messagesInitial = messages.filter((m) => m.isInitial);
    const nInitial = messagesInitial.length;
    const nInitialSystem = messagesInitial.filter((m) => m.role === "system").length;
    const nInitialAi = messagesInitial.filter((m) => m.role === "assistant").length;
    const nInitialHuman = messagesInitial.filter((m) => m.role === "user").length;

    const messagesSubsequent = messages.filter((m) => !m.isInitial);
    const nSubsequent = messagesSubsequent.length;
    const nSubsequentSystem = messagesSubsequent.filter((m) => m.role === "system").length;
    const nSubsequentAi = messagesSubsequent.filter((m) => m.role === "assistant").length;
    const nSubsequentHuman = messagesSubsequent.filter((m) => m.role === "user").length;

    const outputString = `Messages[${messages.length}]: initial[${nInitial}][${nInitialSystem}s${nInitialAi}a${nInitialHuman}h] subsequent[${nSubsequent}][${nSubsequentSystem}s${nSubsequentAi}a${nSubsequentHuman}h]`;

    console.log(outputString);

}


export function isCorrectOriginAndData(event: MessageEvent): boolean {

    // not in frame, so don't need to check origin and data
    if (typeof parent === "undefined" || parent === window) return false;

    const origin = event.origin.toLowerCase();

    // skip vercel.live
    if (origin.includes("vercel.live")) {
        return false;
    }
    let parentObj;
    if (get(allowedOrigins).some((allowedOrigin) => origin.includes(allowedOrigin))) {
        console.log("Received message from parent (allowed origin):", origin);
        parentObj = event.data;
        if (!parentObj) return false; // no data received from parent
        try {
            // process data from parent
            parentObj = JSON.parse(parentObj);
            // in case parent sends other irrelevant stuff to the app
            if (!parentObj.model) {
                // console.error("Incorrect parentObj received:", parentObj);
                return false;
            }
        } catch (error) {
            return false;
        }
        console.log("app received correct messages/chatParams from parent:", event);
        return true;
    } else {
        console.log("Received message from parent (unknown origin):", origin);
        return false;
    }

}


export function initializeChat(
    scrollElement: HTMLDivElement,
    nextSection: boolean,
    event?: MessageEvent,
) {

    let parentObj;
    if (get(inFrame) && event) {  // is in iframe, so chatParams come from messages
        if (isCorrectOriginAndData(event)) {
            parentObj = JSON.parse(event.data);
        } else {
            console.error("Origin not allowed or incorrect parentObj received:", event);
        }
    } else if (!get(inFrame) && !event) {  // not in iframe, so chatParams come from localStorage
        parentObj = localStorage.getItem("parentObj");
        if (parentObj) {
            parentObj = JSON.parse(parentObj);
            console.log("Found parentObj in localStorage", parentObj);
        }
    }

    updateChatParams(parentObj);
    if (!checkIfAPIKeyExist()) {
        receivedParentMessage.set(true);
        return;
    }

    if (!parentObj) {
        console.error("No parentObj received. Exiting...");
        return;
    } else {
        receivedParentMessage.set(true);
    }
    processInitialMessages();

    messageInfo.update((x) => {
        return {
            ...x,
            nInitialMessages: get(initialMessages).length,
        };
    });

    if (get(inFrame) && parentObj) {
        console.log(
            "Updated chatParams with parentObj (after receiving message from parent):",
            get(chatParams),
        )
    } else if (!get(inFrame) && parentObj) {
        console.log(
            "Updated chatParams with parentObj from localStorage:",
            get(chatParams),
        );
    }

    if (get(chatParams).ui.assistantMessageOnLoad && get(initialMessages).length > 0) {
        handleChatInteraction(true, "", scrollElement, nextSection);
    }
    isLoaded.set(true);

};

function checkIfAPIKeyExist(): boolean {
    if (get(chatParams).model.apiKeyEncrypted === "" || !get(chatParams).model.apiKeyEncrypted) {
        isLoaded.set(false);
        console.error("Please provide an encrypted API key to continue.");
        noAPIKeyProvided.set(true);
        return false;
    } else {
        return true;
    }
}

async function fetchChatResponse(stream: boolean = false) {

    let resp;
    let response: Response | undefined = undefined;

    try {
        response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messages: get(messages),
                chatParams: get(chatParams),
            }),
        });

    } catch (error) {
        const msg = "Error with fetch request (fetchChatResponse): /api/chat";
        resp = { aiText: msg };
        console.error(msg, error);
    }

    if (stream && response) {  // streaming
        if (response.status !== 200) {
            const status = response.status;
            let msg: string = "";
            if (response.status === 401) {
                msg = "Error 401 (unauthorized request): Check API key.";
            } else {
                msg = `Error with streaming request ${status}.`;
            }
            console.error(msg);
            resp = { aiText: msg };  // make chatbot show error message
            return resp;
        } else if (response.body === null) {
            const msg = "Response body is null";
            console.error(msg);
            resp = { aiText: msg };
            return resp;
        } else {
            return response;
        }
    } else if (response) {  // not streaming
        if (response.status === 401) {
            const msg = "Error 401 (unauthorized request): Check API key.";
            resp = { aiText: msg };  // make chatbot show error message
        } else {
            resp = await response.json();
            if (resp.message == "Internal Error") {
                resp = { aiText: "Internal Error" };
                throw new Error("Error with handleChatInteraction request");
            }
        }
        return resp;
    }
}

export async function handleChatInteraction(
    sendInitial: boolean = false,
    userInputText: string = "",
    scrollElement: HTMLDivElement,
    nextSection: boolean
) {
    isLoading.set(true);

    // push latest message that needs to be sent over: either initial messages or user message
    if (!sendInitial) {
        if (userInputText === "") {
            return;
        } else {
            addUserMessage(userInputText);
        }
    }

    const response = await fetchChatResponse(get(chatParams).ui.stream);
    timeReceivedResponse.set(new Date().getTime());
    if (get(chatParams).ui.stream) { // streaming
        if (response && response.body) {

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let scrolled = false;
            let streamedText = "";   // store the streamed text to check for stop keyword
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    isLoading.set(false);
                    break;
                }
                const chunk = decoder.decode(value);
                streamedText += chunk;
                addAIMessage(chunk, true);
                // throttle stream so it doesn't load too fast for user to read (to avoid skimming)
                await delay(chunk.length * get(chatParams).ui.streamThrottleRate);
                if (scrollElement && !scrolled) {
                    scrollElement.scrollBy(0, 150);
                    scrolled = true;
                }
            }
            if (checkForStopKeyword(streamedText, get(chatParams))) {
                nextSection = true;
            }
        } else {
            if (response && response.aiText) {
                addAIMessage(response.aiText, true);
                isLoading.set(false);
            } else {
                console.error('Response object for stream or body is null.');
            }
        }
    } else {  // not streaming
        try {
            addAIMessage(response.aiText);
            isLoading.set(false);
        } catch (error) {
            console.error("Error with generateText response", error, response);
            isLoading.set(false);
        }
        // stop the conversation if the stop keyword is detected
        if (checkForStopKeyword(response.aiText, get(chatParams))) {
            nextSection = true;
        }
    }

    handlePostChat(get(messages), nextSection, scrollElement);

    if (
        get(chatParams).ui.showInputBasedOnReadingTime &&
        !get(chatParams).ui.stream
    ) {
        showButtonAfterDelay(false, get(messages));
    }
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


function checkForStopKeyword(text: string, chatParams: ChatParamsType): boolean {
    if (chatParams.study.stopKeyword !== undefined && text.includes(chatParams.study.stopKeyword)) {
        enableSubmit.set(false);
        return true;
    }
    return false;
}
