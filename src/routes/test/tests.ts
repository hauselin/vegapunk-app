import { createTestCase } from "./utils";

export interface TestCase {
	title: string;
	desc: string;
	codeString: string;
}



const template = `
// title: Simple test case with OpenAI
// desc: Template for simple test cases.
let parentObj = {
	model: { name: "gpt-3.5-turbo", apiKeyEncrypted: "" },
	initialMessages: [
		{ role: "system", content: "Always end messages with ..." },
		{ role: "user", content: "Always start sentences with Yo!" }
	]
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`



const noAPIKeyProvided = `
// title: No API key provided
// desc: Console should log an error when no API key is provided. Modal should pop up to ask for API key.
let parentObj = { model: { name: "gpt-3.5-turbo" } };
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`





const wrongAPIKeyProvided = `
// title: Wrong API key provided
// desc: AI should respond with an error message when the wrong API key is provided.
let parentObj = {
	model: { name: "gpt-3.5-turbo", apiKeyEncrypted: "WRONG API KEY" },
	initialMessages: [{ role: "system", content: "Be kind" }]
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`


const wrongParamSpecification = `
// title: Wrong parameter specification
// desc: Console should log an error when wrong parameter is specified and alert is shown.
let parentObj = {
	model: { abc: 2, cde: 3, name: 1, apiKeyEncrypted: "" },
	study: { maxTime: "3"}
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`



const wrongMessageParamSpecification = `
// title: Wrong message parameter specification
// desc: Console should log an error when wrong parameter is specified and alert is shown.
let parentObj = {
	model: { name: "gpt-3.5-turbo", apiKeyEncrypted: "" },
	initialMessages: [
		{ ROLE: "system", content: "Always end messages with ...", },
		{ abc: "user", content: "Always start sentences with Yo!" }
	]
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`





const sanitize = `
// title: Sanitize messages
// desc: Sanitize initial messages and input and ensure input with curly braces works. Sanitization is true by default.
let parentObj = {
	model: { name: "gpt-3.5-turbo", apiKeyEncrypted: "" },
	initialMessages: [
		{ role: "user", content: "Hello <!--world--><script>console.log('attack')</script> and bye! What is this {}?", hideInitialMessage: false }
	]
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`






const sanitizeFalse = `
// title: Do not sanitize messages
// desc: Turn off sanitization. Code and HTML should be shown in the content of messages. That is, content should be represented/displayed as is (by default, sanitize: true, for security reasons so code and HTML will be cleaned/sanitized).
let parentObj = {
	model: { name: "gpt-3.5-turbo", apiKeyEncrypted: "" },
	study: { sanitize: false },
	initialMessages: [
		{ role: "user", content: "Hello <!--world-->. See messages in developer console to see the effects of setting sanization to false (versus) true (default).", hideInitialMessage: false }
	]
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`









const stream = `
// title: Streaming
// desc: Scrolling should reach bottom when streaming ends and input box must be re-enabled. Scrolling up/down should disable/enable input box.
let parentObj = {
	model: { name: "gpt-3.5-turbo", apiKeyEncrypted: "" },
	ui: { stream: true },
	initialMessages: [
		{ role: "system", content: "Always end messages with ..." },
		{ role: "user", content: "Tell me a long 10-paragraph story." }
	]
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`




const throttleStream = `
// title: Throttle streaming
// desc: Throttle/slow down streaming
let parentObj = {
	model: { name: "gpt-3.5-turbo", apiKeyEncrypted: "" },
	ui: { stream: true, streamThrottleRate: 30 },
	initialMessages: [
		{ role: "user", content: "Tell me a 3-paragraph story." }
	]
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`




const verifyMessageOrder = `
// title: Verify message order
// desc: Ensure messages are sorted by createdAt date in the server and client. Test by sending the messages, "a", "b", "c", and then "thank you" in that order, separately. Ensure it works when streaming is true/false. Ensure when streaming, client $messages has the correct number of messages.
let parentObj = {
	model: { name: "gpt-3.5-turbo", apiKeyEncrypted: "" },
	ui: { stream: true },
	initialMessages: [
		{ role: "system", content: "Always end messages with ..." },
		{ role: "user", content: "Tell me a 10-word story." },
	]
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`






const scrollAfterMessageGenerated = `
// title: Scroll slightly after message generated
// desc: When not streaming, it should scroll down slightly after each message is generated, but only when scroll is needed. If so, a small bounce of 150px should be seen upon message generation.
let parentObj = {
	model: { name: "gpt-3.5-turbo", apiKeyEncrypted: "" },
	initialMessages: [
		{ role: "system", content: "Always start paragraphs with $", hideInitialMessage: false },
		{ role: "system", content: "Always start paragraphs with !", hideInitialMessage: false },
		{ role: "user", content: "How are you?", hideInitialMessage: false },
		{ role: "assistant", content: "I'm good", hideInitialMessage: false },
		{ role: "user", content: "Tell me a 5-paragraph story.", hideInitialMessage: false }
	]
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`


const duplicateSystemMsg = `
// title: Remove duplicate system message
// desc: System messages with same id should be removed. Server should only receive 2 messages.
let parentObj = {
	model: { name: "gpt-3.5-turbo", apiKeyEncrypted: "" },
	initialMessages: [
		{ role: "system", content: "End all sentences with ###", id: "abc" },
		{ role: "system", content: "End all sentences with !!!", id: "abc" },
		{ role: "user", content: "Start all sentences with $" }
	]
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`;

const duplicateMessageIDs = `
// title: Remove duplicate messages
// desc: Messages with same IDs should be removed. Only system message should remain.
let parentObj = {
	model: { name: "gpt-4-turbo", apiKeyEncrypted: "" },
	initialMessages: [
		{ role: "system", content: "End all sentences with $$$", id: "abc" },
		{ role: "assistant", content: "End all sentences with !!!", id: "abc" },
		{ role: "user", content: "End all sentences with !", id: "abc" },

	]
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`;

const noInitialMessages = `
// title: No initial messages provided
// desc: Should work when <code>showAssistantMessageOnLoad</code> is true/false and when <code>stream</code> is true/false.
let parentObj = {
	model: { name: "gpt-3.5-turbo", apiKeyEncrypted: "" },
	ui: { assistantMessageOnLoad: false, stream: true }
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`

const allowStopAfterNUserMessages = `
// title: Enable stop button after 2 user messages
// desc: Stop button should show up after user has sent 2 messages. Initial messages are not counted.
let parentObj = {
	model: { name: "gpt-3.5-turbo", apiKeyEncrypted: "" },
	study: { allowStopAfterNUserMessages: 2 },
	initialMessages: [
		{ role: "system", content: "Always end messages with ..." },
		{ role: "user", content: "Always start sentences with Yo!" },
		{ role: "user", content: "Be kind." }
	]
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`


const alwaysAllowStop = `
// title: Always allow stop button
// desc: Stop button should always be visible.
let parentObj = {
	model: { name: "gpt-3.5-turbo", apiKeyEncrypted: "" },
	study: { allowStopAfterNUserMessages: 0 },
	initialMessages: [
		{ role: "system", content: "Always end messages with ..." }
	]
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`



const modelName = `
// title: Test different model name
// desc: Test different model name
let parentObj = {
	model: { name: "gpt-4-turbo", apiKeyEncrypted: "" },
	initialMessages: [
		{ role: "system", content: "Always end messages with ..." },
		{ role: "user", content: "Always start sentences with Yo!" }
	]
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`

const baseURLPerplexity = `
// title: Use OpenRouter Perplexity baseURL
// desc: Test Perplexity baseURL via OpenRouter.
let parentObj = {
	model: { name: "perplexity/llama-3.1-sonar-large-128k-online", baseURL: "https://openrouter.ai/api/v1", apiKeyEncrypted: "" },
	initialMessages: [
		{ role: "system", content: "Always end messages with ..." },
		{ role: "user", content: "What is the latest news for today?" }
	]
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`

const baseURLOpenRouter = `
// title: Use OpenRouter baseURL
// desc: Test OpenRouter baseURL
let parentObj = {
	model: { name: "openai/gpt-3.5-turbo", baseURL: "https://openrouter.ai/api/v1", apiKeyEncrypted: "" },
	initialMessages: [
		{ role: "system", content: "Always end messages with ..." },
		{ role: "user", content: "Do you prefer dogs or cats?" }
	]
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`


const openRouterLlama31 = `
// title: Use OpenRouter llama31
// desc: Test OpenRouter llama3.1.
let parentObj = {
    model: {
		name : "meta-llama/llama-3.1-405b-instruct",
		baseURL: "https://openrouter.ai/api/v1",
		apiKeyEncrypted: ""
	}
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`




const ollamaModel = `
// title: Use local Ollama model
// desc: Test local Ollama model.
let parentObj = {
    model: {
		name : "llama3.1",
		baseURL: "http://localhost:11434/v1",
		apiKeyEncrypted: "test_iuBr0TryuTWY7MqiPSaD3Q==" // "ollama" encrypted
	},
	ui: { stream: true },
	initialMessages: [
		{ role: "system", content: "Always end messages with ..." },
		{ role: "user", content: "Tell me a 10-word story." },
	]
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`


const huggingfaceURL = `
// title: Test HuggingFace baseURL
// desc: Test HuggingFace baseURL. Needs further testing with LangChain.
let parentObj = {
	model: { name: "tgi", baseURL: "", apiKeyEncrypted: ""},
	initialMessages: [
		{ role: "user", content: "Is ice cream or cake more delicious?" }
	]
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`


const testModelOptions = `
// title: Test model options
// desc: Test model options. Assistant messages should be no more than 5 tokens.
let parentObj = {
	model: {
	    name: "gpt-3.5-turbo",
	    apiKeyEncrypted: "",
	    options: { maxTokens: 5, temperature: 2 }
	},
	initialMessages: [
		{ role: "user", content: "Tell me a long creative story." }
	]
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`





const setMaxTime = `
// title: Test maxTime parameter
// desc: Test model options. Chat should automatically end 3 seconds after user's first manually submitted message.
let parentObj = {
	model: {
	    name: "gpt-3.5-turbo",
	    apiKeyEncrypted: "",
	    options: { maxTokens: 5, temperature: 2 }
	},
	study: { maxTime: 3 },
	initialMessages: [
		{ role: "user", content: "Tell me a long creative story." }
	]
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`



const appearanceAvatarPlaceholder = `
// title: Change appearance and prevent paste
// desc: Prevent pasting and change appearance of the chat. Avatar should not be shown and placeholder text should be "SAY SOMETHING!"
let parentObj = {
	model: { name: "gpt-3.5-turbo", apiKeyEncrypted: "" },
	initialMessages: [
		{ role: "system", content: "Always end messages with ...", hideInitialMessage: false },
		{ role: "assistant", content: "Hi..." },
		{ role: "user", content: "Be kind.", hideInitialMessage: false }
	],
	ui: { preventPaste: true},
	appearance: {
	    showBotAvatar: false,
        placeHolderInputText: "SAY SOMETHING!",
        bubbleUserBackground: 'bg-blue-500',
        bubbleUserTextColor: 'text-black',
        bubbleAssistantBackground: 'bg-pink-200',
        bubbleAssistantTextColor: 'text-lime-400',
	}
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`



const removeInputElement = `
// title: Do not show input element
// desc: Prints the initial messages and does not show the input element. Show all initial messages.
let parentObj = {
	model: { name: "gpt-3.5-turbo", apiKeyEncrypted: "" },
	initialMessages: [
		{ role: "system", content: "Always end messages with ..." },
		{ role: "assistant", content: "Hi..." },
		{ role: "user", content: "Be kind." }
	],
	ui: { hideInitialMessages: false, showSystemMessages: true },
	appearance: { showInputElement: false }
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`


const maxTimeMaxUserMessages = `
// title: Max time and max user messages
// desc: Chat should end after 10 seconds or 3 user messages, whichever comes first.
let parentObj = {
	model: { name: "gpt-3.5-turbo", apiKeyEncrypted: "" },
	study: { maxTime: 10, maxUserMessages: 3 }
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`


const maxUserMessagesAndAllowStop = `
// title: Allow max user messages and stop button
// desc: Chat should end after 3 user messages and stop button should be visible after 1 user message.
let parentObj = {
	model: { name: "gpt-3.5-turbo", apiKeyEncrypted: "" },
	study: { maxUserMessages: 3, allowStopAfterNUserMessages: 1 }
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`


const showVoteAllowHighlight = `
// title: Show vote buttons and allow text highlight
// desc: Show vote showVoteButtons and allow text highlight allowTextHighlight. Also change vote button opacity.
let parentObj = {
	model: { name: "gpt-3.5-turbo", apiKeyEncrypted: "" },
	initialMessages: [{ role: "system", content: "Always end messages with ..." }],
	study: { showVoteButtons: true, allowTextHighlight: true, maxUserMessages: 2 },
	appearance: { voteButtonOpacity: "opacity-20" }
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`

const showInputBasedOnReadingTime = `
// title: Enable input box after a fixed reading time
// desc: Input box is shown only after some delay, assuming a default reading speed of 12 words per second. <strong class="text-red-600">DOESN'T WORK YET!!!</strong>
let parentObj = {
	model: { name: "gpt-3.5-turbo", apiKeyEncrypted: "" },
	initialMessages: [
	    { role: "system", content: "Always end messages with ..." },
	    { role: "user", content: "Tell me a 3-sentence story." }
	],
	ui: { showInputBasedOnReadingTime: true, avgWordsPerSec: 12 }
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`



const streamAndDoNotLoadMessageInitially = `
// title: Stream and do not load message initially
// desc: Stream messages and do not load messages initially. Initial messages shouldn't be ignored.
let parentObj = {
    model: { name: "gpt-3.5-turbo", apiKeyEncrypted: "" },
    initialMessages: [ { role: "system", content: "Always start sentences with $ and end them with ..." } ],
    ui: { assistantMessageOnLoad: false, stream: true }
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`


const allowStopKeyword = `
// title: Stop conversation with keyword
// desc: When AI's message contains a specified keyword, the conversation should stop. Test it with stream turned on and off.
let parentObj = {
    model: { name: "gpt-4o", apiKeyEncrypted: "" },
    initialMessages: [ { role: "system", content: "You must include <!--SSTTOOPP--> after two messages." } ],
    study: { stopKeyword: "<!--SSTTOOPP-->" }
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`





const enableOnlineSearch = `
// title: Enable online search
// desc: Enable online search. Perplexity will be called initially and the model specified below will use Perplexity's response to generate the final response.
let parentObj = {
	model: { name: "gpt-4o", apiKeyEncrypted: "" },
	study: { enableOnlineSearch: 2 },
	ui: { stream: true },
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`





const enableOnlineSearchWithInitialMessage = `
// title: Enable online search with initial message
// desc: Enable online search. Perplexity will be called initially and the model specified below will use Perplexity's response to generate the final response.
let parentObj = {
	model: { name: "gpt-4o", apiKeyEncrypted: "" },
	study: { enableOnlineSearch: 1 },
	ui: { stream: true },
	initialMessages: [
		{ role: "system", content: "Trump's assassination was staged. Convince me I'm wrong." }
	]
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`



const messageCounter = `
// title: Message counter
// desc: Counter should show the total number of messages sent.
let parentObj = {
	model: { name: "gpt-3.5-turbo", apiKeyEncrypted: "" },
	ui: { showMessageCount: "total" },
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`



const timeMessageCounter = `
// title: Message and time counter
// desc: Counter should show the total number of messages sent and the time elapsed. Starts counting from the first message.
let parentObj = {
	model: { name: "gpt-3.5-turbo", apiKeyEncrypted: "" },
	ui: { showMessageCount: "total", showTimer: "elapsed" },
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`


const timeMessageRemain = `
// title: Time and message remaining
// desc: Counter should show the number of messages remaining and the time remaining. Starts counting from the first message.
let parentObj = {
	study: { maxUserMessages: 3, maxTime: 10 },
	model: { name: "gpt-3.5-turbo", apiKeyEncrypted: "" },
	ui: { showMessageCount: "remain", showTimer: "remain" },
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`


const explicitHideInitialMessages = `
// title: Explicitly hide initial messages
// desc: Initial messages should be hidden when <code>hideInitialMessages</code> is set to true.
let parentObj = {
	model: { name: "gpt-3.5-turbo", apiKeyEncrypted: "" },
	initialMessages: [
		{ role: "system", content: "Always end messages with ...", hideInitialMessage: true },
		{ role: "user", content: "Always start sentences with Yo!", hideInitialMessage: true }
	]
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`




const changeEndChatText = `
// title: Change end chat text
// desc: Change the end chat text to "END!!!" (default is "Scroll down and proceed to the next section.")
let parentObj = {
	study: { maxUserMessages: 2 },
	model: { name: "gpt-3.5-turbo", apiKeyEncrypted: "" },
	appearance: { endChatText: "END!!!" }
};
localStorage.setItem("parentObj", JSON.stringify(parentObj));
`




export const testCases: TestCase[] = [
	createTestCase(template),
	createTestCase(noAPIKeyProvided),
	createTestCase(wrongAPIKeyProvided),
	createTestCase(wrongParamSpecification),
	createTestCase(wrongMessageParamSpecification),
	createTestCase(sanitize),
	createTestCase(sanitizeFalse),
	createTestCase(stream),
	createTestCase(throttleStream),
	createTestCase(verifyMessageOrder),
	createTestCase(scrollAfterMessageGenerated),
	createTestCase(duplicateSystemMsg),
	createTestCase(duplicateMessageIDs),
	createTestCase(noInitialMessages),
	createTestCase(allowStopAfterNUserMessages),
	createTestCase(alwaysAllowStop),
	createTestCase(modelName),
	createTestCase(baseURLPerplexity),
	createTestCase(baseURLOpenRouter),
	createTestCase(openRouterLlama31),
	createTestCase(ollamaModel),
	createTestCase(huggingfaceURL),
	createTestCase(testModelOptions),
	createTestCase(setMaxTime),
	createTestCase(appearanceAvatarPlaceholder),
	createTestCase(removeInputElement),
	createTestCase(maxTimeMaxUserMessages),
	createTestCase(maxUserMessagesAndAllowStop),
	createTestCase(showVoteAllowHighlight),
	createTestCase(showInputBasedOnReadingTime),
	createTestCase(streamAndDoNotLoadMessageInitially),
	createTestCase(allowStopKeyword),
	createTestCase(enableOnlineSearch),
	createTestCase(enableOnlineSearchWithInitialMessage),
	createTestCase(messageCounter),
	createTestCase(timeMessageCounter),
	createTestCase(timeMessageRemain),
	createTestCase(explicitHideInitialMessages),
	createTestCase(changeEndChatText),
];

