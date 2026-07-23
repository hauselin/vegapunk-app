import { writable, type Writable } from 'svelte/store';

// Store to track loading state, simple boolean value
export const isLoading: Writable<boolean> = writable(false);

// Store for thumbs, assuming an array of any type
// If you know the specific type that should be in the array, replace `any` with that type
export const thumbs: Writable<any[]> = writable([]);

// Store for highlighted strings, which are likely strings
export const highlightedStrings: Writable<string[]> = writable([]);

export const allowedOrigins: Writable<string[]> = writable(["qualtrics.com", "localhost", "sveltekit-vercel-chatbot-git-dev-hauselins-projects.vercel.app", "sveltekit-vercel-chatbot.vercel.app", "sveltekit-vercel-chatbot-git-langchain-hauselins-projects.vercel.app", "sveltekit-vercel-chatbot", "vegapunk", "lionfish-app-n3dp2"]);
