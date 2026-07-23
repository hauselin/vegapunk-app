import { ENCRYPTION_KEY, ENCRYPTION_IV, OPENROUTER_API_KEY } from '$env/static/private';
import { HfInference } from '@huggingface/inference';
import type { ChatParamsType } from '$lib/chatParams';
import { decrypt } from './utils';
import { ChatOpenAI } from '@langchain/openai';

export const createOpenAIProvider = (chatParams: ChatParamsType, enableStreaming = false) => {
    //https://v02.api.js.langchain.com/classes/langchain_openai.ChatOpenAI.html
    // Log the parameters to debug
    return new ChatOpenAI({
        streaming: enableStreaming,
        model: chatParams.model.name,
        apiKey: decrypt(ENCRYPTION_KEY, ENCRYPTION_IV, chatParams.model.apiKeyEncrypted),
        maxTokens: chatParams.model.options.maxTokens,
        temperature: chatParams.model.options.temperature,
        frequencyPenalty: chatParams.model.options.frequencyPenalty,
        presencePenalty: chatParams.model.options.presencePenalty,
        maxRetries: chatParams.model.options.maxRetries,
        timeout: chatParams.model.options.timeout,
        configuration: {
            baseURL: chatParams.model.baseURL,
        },
    });
};

export const createHuggingFaceProvider = (chatParams: ChatParamsType) => {
    // https://www.npmjs.com/package/@huggingface/inference
    // BUT: maybe have to set up a custom langchain provider instead
    const inference = new HfInference(decrypt(ENCRYPTION_KEY, ENCRYPTION_IV, chatParams.model.apiKeyEncrypted));
    return inference.endpoint(chatParams.model.baseURL);
};


export const createOnlineSearchProvider = (chatParams: ChatParamsType, enableStreaming = false) => {
    //https://v02.api.js.langchain.com/classes/langchain_openai.ChatOpenAI.html
    return new ChatOpenAI({
        streaming: enableStreaming,
        model: "perplexity/sonar-pro",
        apiKey: OPENROUTER_API_KEY,
        configuration: {
            baseURL: "https://openrouter.ai/api/v1",
        },
        maxRetries: chatParams.model.options.maxRetries,
        timeout: chatParams.model.options.timeout,
    });
};
