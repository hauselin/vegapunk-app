// We use an `interface` to define the structure of an object and
// then use `const` to create an object that adheres to that structure

// https://cookbook.openai.com/examples/how_to_format_inputs_to_chatgpt_models
// NOTE: for perplexity, all user and assistant messages MUST alternate (not necessary for openai)

import { writable, type Writable } from 'svelte/store';

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

export interface ModelOptions {
    maxTokens?: number;
    temperature?: number;
    presencePenalty?: number;
    frequencyPenalty?: number;
    maxRetries?: number;
    timeout?: number; // milliseconds
    onFinish?: () => void;
}

export interface Model {
    name: string;
    baseURL: string;
    apiKeyEncrypted: string;
    options: ModelOptions;
}

export interface Study {
    maxUserMessages: number;
    maxTime: number;
    allowStopAfterNUserMessages: number;
    showVoteButtons?: boolean;
    allowTextHighlight?: boolean;
    stopKeyword?: string;
    enableOnlineSearch: number;
    sanitize: boolean;
}

export interface UI {
    stream: boolean;
    streamThrottleRate: number;
    preventPaste: boolean;
    showMessageCount: 'none' | 'total' | 'remain';
    showTimer: "none" | "elapsed" | "remain";
    assistantMessageOnLoad: boolean;
    hideInitialMessages: boolean;
    showSystemMessages: boolean;
    showInputBasedOnReadingTime: boolean;
    avgWordsPerSec: number;
}

export interface Appearance {
    showBotAvatar: boolean;
    bubbleAssistantBackground: string;
    bubbleAssistantTextColor: string;
    bubbleUserBackground: string;
    bubbleUserTextColor: string;
    voteButtonOpacity: string;
    placeHolderInputText: string;
    endChatText: string;
    showInputElement: boolean;
}

export interface ChatParamsType {
    model: Model;
    study: Study;
    initialMessages: ChatMessageType[];
    ui: UI;
    appearance: Appearance;
    appURL_: string;
}

export const chatParams = writable<ChatParamsType>({
    model: {
        name: "gpt-4o",
        baseURL: "https://api.openai.com/v1/",
        apiKeyEncrypted: "",
        options: {
            maxTokens: undefined,
            temperature: undefined,
            presencePenalty: undefined,
            frequencyPenalty: undefined,
            maxRetries: 5,
            timeout: 600000,  // milliseconds
            onFinish: undefined
        }
    },
    study: {
        maxUserMessages: +Infinity,
        maxTime: +Infinity,
        allowStopAfterNUserMessages: +Infinity,
        showVoteButtons: false,
        allowTextHighlight: false,
        stopKeyword: undefined,
        enableOnlineSearch: 0,
        sanitize: true
    },
    initialMessages: [],
    ui: {
        stream: false,
        streamThrottleRate: 0,
        preventPaste: false,
        showMessageCount: "none",
        showTimer: "none",
        assistantMessageOnLoad: true,
        hideInitialMessages: true,
        showSystemMessages: false,
        showInputBasedOnReadingTime: false,
        avgWordsPerSec: 12
    },
    appearance: {
        showBotAvatar: true,
        bubbleAssistantBackground: 'bg-white',
        bubbleAssistantTextColor: 'text-black',
        bubbleUserBackground: 'bg-slate-800',
        bubbleUserTextColor: 'text-white',
        voteButtonOpacity: "opacity-60",
        placeHolderInputText: "Say something...",
        endChatText: "Scroll down and proceed to the next section.",
        showInputElement: true,
    },
    appURL_: ""
});


type UpdateChatParamsType = (updates: Partial<ChatParamsType>) => void;

export const updateChatParams: UpdateChatParamsType = (updates) => {

    let wrongTypes: string[] = [];
    let wrongKeys: string[] = [];

    chatParams.update(current => {
        const stack: [any, any][] = [[current, updates]];
        while (stack.length > 0) {
            const [currentD1, currentD2] = stack.pop()!;
            for (const key in currentD2) {
                if (!currentD1.hasOwnProperty(key)) {
                    const msg = `${key}`;
                    wrongKeys.push(msg);
                    continue;
                }
                if (Array.isArray(currentD2[key]) && Array.isArray(currentD1[key])) {
                    currentD1[key] = currentD2[key];
                    continue;
                };

                if (currentD1[key] !== undefined && (currentD2[key].constructor !== currentD1[key].constructor)) {
                    const msg = `\n- ${key}: expected ${currentD1[key].constructor.name} (default: ${currentD1[key]}); received ${currentD2[key].constructor.name}`;
                    wrongTypes.push(msg);
                    continue;
                }

                if (typeof currentD2[key] === 'object' && currentD2[key] !== null && typeof currentD1[key] === 'object' && currentD1[key] !== null) {
                    stack.push([currentD1[key], currentD2[key]]);
                } else {
                    currentD1[key] = currentD2[key];
                }
            }
        }

        if (wrongKeys.length + wrongTypes.length > 0) {
            let alertMsg = "Error with chat parameters\n\n";
            if (wrongKeys.length > 0) {
                alertMsg += `Invalid (ignored) parameters: ${wrongKeys.join(", ")}`;
            }
            if (wrongTypes.length > 0) {
                if (!alertMsg.endsWith("\n\n")) alertMsg += "\n\n";
                alertMsg += `Invalid types${wrongTypes.join("")}`;
            }
            alert(alertMsg);
            throw new Error("Chat parameters validation failed.");
        }

        return current;
    });
};

