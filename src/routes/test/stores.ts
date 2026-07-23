import { writable, type Writable } from 'svelte/store';

export const apiKeyEncrypted: Writable<string> = writable("");
