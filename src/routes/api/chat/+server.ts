import type { ChatMessageType, ChatParamsType } from '$lib/chatParams';
import { logger } from '$lib/logger';
import { processMessages } from '$lib/messages';
import { HttpResponseOutputParser } from 'langchain/output_parsers';
import type { RequestHandler } from './$types';
import { createHuggingFaceProvider, createOnlineSearchProvider, createOpenAIProvider } from './providers';
import { checkIfMessageRequiresSearch, constructSystemPrompt, generatePromptTemplateContent, generateResponse, performOnlineSearch, updateMessageWithSearchResults } from './utils';

import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';

export const POST: RequestHandler = (async ({ request }): Promise<Response> => {
    console.log("\n\n\n\n\n")
    logger.info(`=========== ${new Date().toISOString()} ======================`);
    try {
        const response = await request.json() as { messages: ChatMessageType[], chatParams: ChatParamsType };
        logger.debug(`Incoming request data object keys: ${Object.keys(response).join(", ")}`);
        let { messages, chatParams } = response;

        messages = processMessages(messages, false);
        const promptSystem: string = constructSystemPrompt(messages);

        let provider;
        if (chatParams.model.baseURL?.includes("huggingface")) {
            provider = createHuggingFaceProvider(chatParams);
        } else {
            provider = createOpenAIProvider(chatParams);
        }

        logger.info(`Data for API call: ${chatParams.model.baseURL}, ${chatParams.model.name}`);
        logger.info(`promptSystem: ${promptSystem}`)
        logger.debug({ messages });
        logger.debug(`number of messages: ${messages.length}`);

        if (chatParams.ui.stream) {
            if (chatParams.study.enableOnlineSearch > 0) {
                // if using online search, we need to generate response with online search first
                return await handleGeneratedResponse(provider, chatParams, promptSystem, messages);
            } else {
                return await handleStreamingResponse(provider, chatParams, promptSystem, messages);
            }
        } else {
            return await handleGeneratedResponse(provider, chatParams, promptSystem, messages);
        }

    } catch (error) {
        let statusCode = 400;
        if (error instanceof Error) {
            const errorMessage = error.message;
            logger.error(errorMessage, "Error handling request:");
            if (errorMessage.toLowerCase().includes("api key") || (error as any).status === 401) {
                statusCode = 401;
            }
        } else {
            logger.error(error, "Error handling request (unknown error):");
        }
        return new Response("Internal Server Error", { status: statusCode });
    }
}) satisfies RequestHandler;



async function handleStreamingResponse(provider: any,
    chatParams: ChatParamsType, promptSystem: string,
    messages: ChatMessageType[]): Promise<Response> {

    logger.debug("Streaming response...");

    const promptContent = generatePromptTemplateContent(messages, promptSystem);
    const parser = new HttpResponseOutputParser();
    const promptTemplate = ChatPromptTemplate.fromMessages(promptContent);
    const conversationChain = promptTemplate.pipe(provider).pipe(parser);

    try {
        const responseStream = await conversationChain.stream({});
        const httpResponse = new Response(responseStream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
            },
        });
        logger.debug("=============================================")
        return httpResponse;
    } catch (error) {
        if (error instanceof Error) {
            logger.error(error, "Error streaming text:");
            const status = (error as any).status || 400;
            return new Response("Internal Server Error", { status });
        } else {
            logger.error("An unknown error occurred", "Error streaming text:");
            return new Response("Internal Server Error", { status: 500 });
        }
    }

}



async function handleGeneratedResponse(provider: any, chatParams: ChatParamsType, promptSystem: string, messages: ChatMessageType[]): Promise<Response> {

    logger.debug("Generating response...");
    let assistantText: string = "";

    if (chatParams.study.enableOnlineSearch === 0) {
        // BUG: not working with Hugging Face model
        if (chatParams.model.baseURL?.includes("huggingface")) {
            // https://www.npmjs.com/package/@huggingface/inference
            logger.debug("Using Hugging Face model...");
            const huggingfaceModelMessages = messages.map((message) => ({
                role: message.role,
                content: message.content
            }));

            try {
                const huggingfaceModelResponse = await provider.chatCompletion({
                    model: chatParams.model.name,
                    messages: huggingfaceModelMessages
                });
                logger.debug(huggingfaceModelResponse, "Hugging Face model response:")
                assistantText = huggingfaceModelResponse.choices[0].message.content;
            } catch (error) {
                assistantText = "Error with Hugging Face model. " + error;
                logger.error(error, "Error with Hugging Face model:");
            }
        } else {
            const promptContent = generatePromptTemplateContent(messages, promptSystem);
            const parser = new StringOutputParser();
            const promptTemplate = ChatPromptTemplate.fromMessages(promptContent);
            const conversationChain = promptTemplate.pipe(provider).pipe(parser);
            assistantText = await conversationChain.invoke({});
        }
    } else {  // online search enabled

        // determine whether to perform online search
        let performSearch = false;
        // always search if there's only 1 (system) message
        if (messages.length === 1 && messages[0].role === "system") {
            performSearch = true;
        } else {
            // check whether the last message requires online search
            const lastMessage = messages[messages.length - 1];
            const chain = checkIfMessageRequiresSearch(lastMessage, provider);
            const response = await chain.invoke({});
            logger.debug("Message type: " + response);
            response.toLowerCase().includes("other") ? performSearch = false : performSearch = true;
        }

        // perform online search if needed
        let searchResults = "";
        if (performSearch) {
            const provider = createOnlineSearchProvider(chatParams);
            let chainOnlineSearch = performOnlineSearch(messages, promptSystem, provider);
            searchResults = await chainOnlineSearch.invoke({});
            logger.debug("Search results:\n" + searchResults);
        } else {
            logger.debug("No online search needed");
        }

        // update messages with search results
        const updated = updateMessageWithSearchResults(messages, promptSystem, searchResults);

        // generate response with updated messages
        const promptContent = generatePromptTemplateContent(updated.messagesClone, updated.promptSystem);
        const parser = new StringOutputParser();
        const promptTemplate = ChatPromptTemplate.fromMessages(promptContent);
        const conversationChain = promptTemplate.pipe(provider).pipe(parser);

        let searchResultsFormatted = "";
        if (chatParams.study.enableOnlineSearch > 0 && performSearch) {
            searchResultsFormatted = `<div class='!text-indigo-400'>Online search results\n\n${searchResults}<hr></div>\n\n`;
            if (chatParams.study.enableOnlineSearch === 1) {
                searchResultsFormatted = `<!--${searchResultsFormatted}-->`;  // hide results in ai text
            } else if (chatParams.study.enableOnlineSearch === 3) {
                searchResultsFormatted = ""; // do not include search results in ai text
            }
        }

        if (chatParams.ui.stream) {
            // prepend search results to stream
            const prefixStream = new TransformStream({
                start(controller) {
                    controller.enqueue(searchResultsFormatted);
                },
                transform(chunk, controller) {
                    controller.enqueue(chunk);
                }
            });

            const responseStream = (await conversationChain.stream({})).pipeThrough(prefixStream);
            const httpResponse = new Response(responseStream, {
                headers: {
                    "Content-Type": "text/plain; charset=utf-8",
                },
            });
            logger.debug("=============================================")
            return httpResponse;
        } else {
            assistantText = await conversationChain.invoke({});
            assistantText = searchResultsFormatted + assistantText;
        }
    }
    logger.debug("Generated and returning response");
    logger.debug("=============================================")
    return generateResponse(messages, assistantText);
}



