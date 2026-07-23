import { generateId } from "ai";
import DOMPurify from "isomorphic-dompurify";
import { get, writable, type Writable } from 'svelte/store';
import { enableSubmit, timeStart } from "../routes/utils";
import { chatParams } from "./chatParams";

export interface ChatMessageType {
    id: string;
    content: string;
    hideInitialMessage?: boolean;
    isInitial?: boolean;
    createdAt: Date;
    thumb?: string;
    thumbAt?: Date;
    role: 'user' | 'assistant' | 'system';
}

export interface MessageInfoType {
    nTotalMessages: number;
    nInitialMessages: number;
    nNonInitialMessages: number;
    nSystemMessages: number;
    nUserMessages: number;
    nAssistantMessages: number;
}

interface MessageDisplaySettingType {
    nWords: number;
    messageDisplayDuration: number;
    messageDisplayStartTime: number;
    avgWordsPerSec: number;
    avgSecondsPerWord: number;
    minReadingTime: number;
    doneReading: boolean;
}


// Store to hold an array of complete chat messages
export const messages: Writable<ChatMessageType[]> = writable([]);

// Store to hold an array of initial chat messages passed in chatParams
export const initialMessages: Writable<ChatMessageType[]> = writable([]);

// Store to hold user messages
export const userInput: Writable<string> = writable("");

// Store to hold message count information
export const messageInfo: Writable<MessageInfoType> = writable({
    nTotalMessages: 0,
    nInitialMessages: 0,
    nNonInitialMessages: 0,
    nSystemMessages: 0,
    nUserMessages: 0,
    nAssistantMessages: 0,
});

export const messageDisplaySetting: Writable<MessageDisplaySettingType> = writable({
    nWords: 0,
    messageDisplayDuration: 0,
    messageDisplayStartTime: 0,
    avgWordsPerSec: 0,
    avgSecondsPerWord: 0,
    minReadingTime: 0,
    doneReading: true,
});


////////////////////////////////////////
// Helper Functions for messages store
////////////////////////////////////////

function generateNewAIMessage(aiText: string): ChatMessageType {
    return {
        role: "assistant",
        content: aiText,
        id: generateId(),
        createdAt: new Date(),
        hideInitialMessage: false,
        isInitial: false,
    };
}

function generateNewUserMessage(userText: string): ChatMessageType {
    return {
        role: "user",
        content: userText,
        id: generateId(),
        createdAt: new Date(),
        hideInitialMessage: false,
        isInitial: false,
    };
}



export function addAIMessage(aiText: string, stream: boolean = false): void {
    const defaultText = "Sorry, the AI model is momentarily down. Please try again by typing <strong>continue</strong>.";
    aiText = aiText || defaultText;
    messages.update((currentMessages) => {
        // Check if there is at least one message and the last message if from the AI with empty content
        const messageLength = currentMessages.length;
        if (messageLength > 0 &&
            currentMessages[messageLength - 1].role === "assistant" &&
            currentMessages[messageLength - 1].content === "") {
            // Create a copy of the current messages
            let updatedMessages = [...currentMessages];
            // Replace the last message
            updatedMessages[messageLength - 1] = generateNewAIMessage(aiText);
            return [...updatedMessages];
        } else if (stream && messageLength > 0 && currentMessages[messageLength - 1].role === "assistant") {
            let updatedMessages = [...currentMessages];
            updatedMessages[updatedMessages.length - 1].content += aiText;
            return [...updatedMessages];
        }
        // If not streaming or no previous AI message, create a new AI message
        let updatedMessages = [...currentMessages];
        updatedMessages.push(generateNewAIMessage(aiText));
        return updatedMessages;
    });
    messages.set(processMessages(get(messages), true));
}

export function addEmptyAIMessage(): void {
    messages.update((currentMessages) => [
        ...currentMessages,
        { role: "assistant", content: "" },
    ] as ChatMessageType[]);
}


export function addUserMessage(userText: string): void {
    messages.update((currentMessages) => {
        return [...currentMessages, generateNewUserMessage(userText)];
    });
    messages.set(processMessages(get(messages), true));
}

function addInitialMessages(): void {
    const incomingMessages = get(initialMessages)
    incomingMessages.map((message) => {
        if (message.hideInitialMessage === undefined) {
            message.hideInitialMessage = false;
        }
        return message;
    });

    messages.update((currentMessages) => {
        return [...currentMessages, ...incomingMessages];
    });
    messages.set(processMessages(get(messages), true));
}



export function processInitialMessages(): void {

    let initialMessagesTemp = get(chatParams).initialMessages;
    initialMessagesTemp = validateMessages(initialMessagesTemp, true, true); // Validate Initial Messages Received
    if (initialMessagesTemp.length === 0) return;

    let updatedInitialMessages: ChatMessageType[] = [];
    let seenIds = new Set<string>();

    for (let idx = 0; idx < initialMessagesTemp.length; idx++) {
        //let message: ChatMessageType = {} as ChatMessageType;
        const currentInitialMessage = initialMessagesTemp[idx];
        const messageID = currentInitialMessage.id ?? generateId();

        if (!seenIds.has(messageID)) {
            seenIds.add(messageID);
            let messageContent = currentInitialMessage.content;
            if (get(chatParams).study.sanitize) {
                messageContent = DOMPurify.sanitize(messageContent);
            }
            let message = {
                id: messageID,
                content: messageContent,
                createdAt: currentInitialMessage.createdAt ?? new Date(new Date().getTime() + 100 * idx),
                role: currentInitialMessage.role,
                isInitial: true,
            } as ChatMessageType;

            if (currentInitialMessage.hideInitialMessage === undefined) {
                if (currentInitialMessage.role === "system") {
                    message.hideInitialMessage =
                        !get(chatParams).ui.showSystemMessages;
                } else {
                    message.hideInitialMessage =
                        get(chatParams).ui.hideInitialMessages;
                }
            } else {
                message.hideInitialMessage = currentInitialMessage.hideInitialMessage
            }
            updatedInitialMessages.push(message);
        } else {
            console.log("Duplicate initial message found, skipping...");
        }
    }
    initialMessages.set(updatedInitialMessages);
    addInitialMessages();

};



function validateMessages(messages: ChatMessageType[], clientSide: boolean = true, initialMessage: boolean = false): ChatMessageType[] {
    const validKeys = ['id', 'content', 'hideInitialMessage', 'isInitial', 'createdAt', 'thumb', 'thumbAt', 'role'];
    const validRoles = ['user', 'assistant', 'system'];
    const errors: any[] = [];

    messages.forEach((message, index) => {
        const requiredKeys = ['role', 'content'];
        for (const key in message) {
            if (!validKeys.includes(key)) {
                errors.push(`Message ${index} invalid parameter: ${key}`);
            }
            // if key is in requiredKeys, delete it from requiredKeys
            if (requiredKeys.includes(key)) {
                requiredKeys.splice(requiredKeys.indexOf(key), 1);
            }
        }
        if (requiredKeys.length > 0) {
            errors.push(`Message ${index} missing parameter: ${requiredKeys.join(', ')}`);
        }
        if (!validRoles.includes(message.role)) {
            errors.push(`Message ${index} invalid role: ${message.role}`);
        }
        if (typeof message.content !== 'string') {
            errors.push(`Message ${index} type error: expected string, got ${typeof message.content}`);
        }
        if (typeof message.id !== 'string' && !initialMessage) {
            errors.push(`Message ${index} type error: expected string, got ${typeof message.id}`);
        }
        if (message.createdAt && !(message.createdAt instanceof Date) && !initialMessage) {
            errors.push(`Message ${index} type error: expected Date, got ${typeof message.createdAt}`);
            console.error("Message createdAt:", message.createdAt);
        }
    });

    if (errors.length > 0) {
        const errorMessage = `Message validation errors\n\n${errors.join('\n')}`;
        if (clientSide) {
            alert(errorMessage);
        } else {
            console.error(errorMessage);
        }
        if (initialMessage) {
            throw new Error("Message validation failed.");
        }
    }
    return messages;
};


// ensure all messages have Date objects for createdAt
export function convertMessageDates(messages: ChatMessageType[]): ChatMessageType[] {
    messages.forEach((message) => {
        if (typeof message.createdAt === 'string') {
            if ((message.createdAt as string).includes("Z") && (message.createdAt as string).includes("T")) {
                message.createdAt = new Date(message.createdAt);
            }
        }
    });
    return messages;
}


// main function to process messages by calling other helper functions
export const processMessages = (messages: ChatMessageType[], isClient: boolean = true) => {
    if (!isClient) {
        messages = convertMessageDates(messages);
    }
    messages = validateMessages(messages, isClient);
    messages = filterAndSortMessages(messages);
    return messages
};

// dedup and sort messages
const filterAndSortMessages = (messages: ChatMessageType[]) => {
    if (!messages) return [];
    let includedIds: string[] = [];
    messages = messages.filter((message) => {
        if (includedIds.includes(message.id)) return false;
        includedIds.push(message.id);
        return true;
    })
    messages = messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return messages;
};

export function countMessages(messages: ChatMessageType[]): number {
    let nTotalMessages = messages.length;
    let nUserMessages = messages.filter(
        (m) => m.role === "user" && m.isInitial === false,
    ).length;
    let nAssistantMessages = messages.filter(
        (m) => m.role === "assistant" && m.isInitial === false,
    ).length;
    let nSystemMessages = messages.filter(
        (m) => m.role === "system",
    ).length;

    if (nUserMessages >= get(chatParams).study.maxUserMessages) {
        enableSubmit.set(false);
    }

    const nInitialMessages = get(initialMessages).length;

    messageInfo.set({
        nTotalMessages,
        nInitialMessages: nInitialMessages,
        nNonInitialMessages: nTotalMessages - nInitialMessages,
        nSystemMessages,
        nUserMessages,
        nAssistantMessages,
    });

    return get(timeStart);
}
