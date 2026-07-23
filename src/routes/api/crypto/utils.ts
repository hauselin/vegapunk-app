
import CryptoJS from "crypto-js";

export function encrypt(key: string, iv: string, text: string) {
	const encrypted = CryptoJS.AES.encrypt(
		text,
		CryptoJS.enc.Hex.parse(key),
		{
			iv: CryptoJS.enc.Hex.parse(iv),
			mode: CryptoJS.mode.CBC,
			padding: CryptoJS.pad.Pkcs7,
		},
	);
	return encrypted.toString();
}

export function decrypt(key: string, iv: string, ciphertext: string) {
	const decrypted = CryptoJS.AES.decrypt(
		ciphertext,
		CryptoJS.enc.Hex.parse(key),
		{
			iv: CryptoJS.enc.Hex.parse(iv),
			mode: CryptoJS.mode.CBC,
			padding: CryptoJS.pad.Pkcs7,
		},
	);
	// console.log("decrypted", decrypted.toString(CryptoJS.enc.Utf8));
	return decrypted.toString(CryptoJS.enc.Utf8);
}
