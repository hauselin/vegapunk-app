import type { ChatMessageType } from "./chatParams";

export const encrypt = async (inputText: string): Promise<string> => {
    const res = await fetch("/api/crypto", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: inputText }),
    });
    const data = await res.json();
    let ciphertext: string = data.ciphertext;
    return ciphertext;
};
