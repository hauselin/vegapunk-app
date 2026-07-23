import type { ChatMessageType } from "$lib/chatParams";
import { logger } from "$lib/logger";
import CryptoJS from "crypto-js";
import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';

export const decrypt = (key: string, iv: string, ciphertext: string): string => {
    const decrypted = CryptoJS.AES.decrypt(
        ciphertext,
        CryptoJS.enc.Hex.parse(key),
        {
            iv: CryptoJS.enc.Hex.parse(iv),
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
        },
    );
    return decrypted.toString(CryptoJS.enc.Utf8);
}


// https://github.com/vercel/ai/issues/1066#issuecomment-2059501479
export const logStream = (originalStream: ReadableStream, throttleStream: number): ReadableStream => {
    const [loggedStream, loggingStream] = originalStream.tee();
    return new ReadableStream({
        async start(controller) {
            const reader = loggingStream.getReader();
            async function read() {
                try {
                    const { done, value } = await reader.read();
                    if (done) {
                        try {
                            controller.close();
                        } catch (e) {
                            logger.error(e, "Error closing controller:");
                        }
                        return;
                    }
                    controller.enqueue(value);
                    await new Promise(resolve => setTimeout(resolve, throttleStream));
                    read();
                } catch (e) {
                    logger.error(e, "Error reading stream or stream already closed:");
                }
            }
            read();
        }
    });
}


// Construct system prompt with all system messages (concatenate them)
export function constructSystemPrompt(messages: ChatMessageType[]): string {
    let promptSystem = '';
    messages.forEach(message => {
        if (message.role === 'system') {
            promptSystem += message.content + " ";
        }
    });
    return promptSystem;
}

export function generateResponse(messages: ChatMessageType[], assistantText: string): Response {
    return new Response(JSON.stringify({
        aiText: assistantText,
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}

function replaceBraces(str: string): string {
    // replace all { with {{ and } with }} to escape them so langchain templates work
    return str.replace(/\{/g, '{{').replace(/\}/g, '}}');
}

export function generatePromptTemplateContent(messages: ChatMessageType[], promptSystem: string): any {
    let promptContent: any = [];
    if (promptSystem.includes("{")) {
        promptSystem = replaceBraces(promptSystem);
    }
    promptContent.push(['system', promptSystem]);
    messages.forEach(message => {
        if (message.content.includes("{")) {
            message.content = replaceBraces(message.content);
        }
        if (message.role === 'user') {
            promptContent.push(['human', message.content]);
        } else if (message.role === 'assistant') {
            promptContent.push(['ai', message.content]);
        }
    });
    return promptContent;
}



export function checkIfMessageRequiresSearch(message: ChatMessageType, provider: any): any {

    logger.debug("Checking if message requires search...");

    const systemPrompt = `Your only role is to analyze a human/user message and classify it as one of these categories: question, opinion, claim, argument, or request, so please do not perform any other tasks. Respond with only the single most appropriate category. If the message contains multiple categories, choose the most dominant one. If it's a greeting, expressions of gratitude/emotion, expressive utterance, formulaic or phatic expression (such as, but definitely not limited to these: hello, hi, good morning, good bye, thank you, bye for now, thanks, appreciate it, how are you, what's up, how's your day, what's your name, how's the weather, are you a bot/AI, do you have a knowledge cutoff), respond 'other'. If unsure or the message is unclear, respond 'other'.`;

    const messageClone = structuredClone(message);

    messageClone.content = `Analyze the following user message within the square brackets and classify it as one of these categories: question, opinion, claim, argument, or request (choose the most dominant one if a message contains multiple categories; if unclear, respond 'other'): [${messageClone.content}]`;


    const promptContent = [
        ['system', systemPrompt],
        ['human', messageClone.content],
    ] as Array<[string, string]>;

    const parser = new StringOutputParser();
    const promptTemplate = ChatPromptTemplate.fromMessages(promptContent);
    const chain = promptTemplate.pipe(provider).pipe(parser);

    return chain;

}



export function performOnlineSearch(messages: ChatMessageType[], promptSystem: string, provider: any): any {

    logger.debug("Performing online search...")

    const messagesClone = structuredClone(messages);

    let extraSystemPrompt =
        "\n\nImportantly, find and provide the most relevant/up-to-date facts; cite news sources/websites if necessary; ensure your response is always factual.";

    if (messages.length > 1) {
        extraSystemPrompt = "\n\nImportantly, find and provide the most relevant/up-to-date facts related to the conversation/chat history/messages above; cite news sources/websites if necessary; ensure your response is always factual.";
    }

    // add extra prompt to system prompt
    if (messagesClone[0].role === "system") {
        messagesClone[0].content = `${messagesClone[0].content} ${extraSystemPrompt}`;
    }

    // if last message isn't a human message, copy it and make it a human message so perplexity works (perplexity requires a human message as the final message)
    if (messagesClone[messagesClone.length - 1].role !== "user") {
        const newMessage = structuredClone(messagesClone[messagesClone.length - 1]);
        newMessage.role = "user";
        messagesClone.push(newMessage);
    }

    const promptContent = generatePromptTemplateContent(messagesClone, promptSystem);
    // logger.debug(promptContent, "Prompt content for online search:");
    const parser = new StringOutputParser();
    const promptTemplate = ChatPromptTemplate.fromMessages(promptContent);
    const chain = promptTemplate.pipe(provider).pipe(parser);
    return chain;
}


export function updateMessageWithSearchResults(messages: ChatMessageType[], promptSystem: string, searchResults: string): any {

    // logger.debug("searchResults: " + searchResults);

    const messagesClone = structuredClone(messages);

    if (searchResults) {

        const extraContent = `Please always assume and pretend you do not have a knowledge cutoff and always use the information inside the double square brackets to construct your response (but never square brackets in your response): [[${searchResults}]].`;

        // update system prompt to tell it to use information from search results
        promptSystem = `${promptSystem}\n\n${extraContent}`;

        // create content for extra instructions that uses searchResults
        let extraInstructionsForMessage = "";
        if (searchResults) extraInstructionsForMessage = `\n\n${extraContent}`;

        // update system prompt
        if (messagesClone[0].role === "system") {
            messagesClone[0].content = promptSystem;
        }

        // add extra instructions to last message, only if it's a human message (to avoid duplicating extra prompts)
        if (messagesClone[messagesClone.length - 1].role === "user") {
            messagesClone[messagesClone.length - 1].content = `${messagesClone[messagesClone.length - 1].content} ${extraInstructionsForMessage} `;
        }
        logger.debug(messagesClone[messagesClone.length - 1], "Last message after updating with search results:");
    }

    return { messagesClone, promptSystem };
}
