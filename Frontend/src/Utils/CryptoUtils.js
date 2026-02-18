/**
 * CryptoUtils.js
 * Comprehensive utility for End-to-End Encryption (E2EE) using Web Crypto API.
 * Patterns: RSA-OAEP (2048) for key exchange, AES-GCM (256) for payload encryption.
 */

const RSA_ALGO = {
    name: "RSA-OAEP",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256",
};

const AES_ALGO = {
    name: "AES-GCM",
    length: 256,
};

/**
 * Checks if the Web Crypto API (Subtle) is supported in the current context.
 * It is typically disabled in insecure contexts (non-HTTPS or non-localhost).
 */
export const isCryptoSupported = () => {
    return !!(window.crypto && window.crypto.subtle);
};

/**
 * Generates an RSA key pair for the user
 */
export const generateRSAKeyPair = async () => {
    if (!isCryptoSupported()) {
        throw new Error("Web Crypto API (Subtle) is not supported in this context. Please use a secure connection (HTTPS or localhost).");
    }
    return await window.crypto.subtle.generateKey(
        RSA_ALGO,
        true, // extractable
        ["encrypt", "decrypt"]
    );
};

/**
 * Exports a public key to SPKI format (base64)
 */
export const exportPublicKey = async (publicKey) => {
    if (!isCryptoSupported()) throw new Error("Crypto not supported");
    const exported = await window.crypto.subtle.exportKey("spki", publicKey);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
};

/**
 * Imports a public key from base64 SPKI format
 */
export const importPublicKey = async (publicKeyB64) => {
    const binaryDerString = atob(publicKeyB64);
    const binaryDer = new Uint8Array(binaryDerString.length);
    for (let i = 0; i < binaryDerString.length; i++) {
        binaryDer[i] = binaryDerString.charCodeAt(i);
    }
    if (!isCryptoSupported()) throw new Error("Crypto not supported");
    return await window.crypto.subtle.importKey(
        "spki",
        binaryDer.buffer,
        RSA_ALGO,
        true,
        ["encrypt"]
    );
};

/**
 * Exports a private key to PKCS8 format (base64)
 */
export const exportPrivateKey = async (privateKey) => {
    if (!isCryptoSupported()) throw new Error("Crypto not supported");
    const exported = await window.crypto.subtle.exportKey("pkcs8", privateKey);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
};

/**
 * Imports a private key from base64 PKCS8 format
 */
export const importPrivateKey = async (privateKeyB64) => {
    const binaryDerString = atob(privateKeyB64);
    const binaryDer = new Uint8Array(binaryDerString.length);
    for (let i = 0; i < binaryDerString.length; i++) {
        binaryDer[i] = binaryDerString.charCodeAt(i);
    }
    if (!isCryptoSupported()) throw new Error("Crypto not supported");
    return await window.crypto.subtle.importKey(
        "pkcs8",
        binaryDer.buffer,
        RSA_ALGO,
        true,
        ["decrypt"]
    );
};

/**
 * Encrypts data using AES-GCM and returns ciphertext + IV + original key + encrypted key
 * @param {string} plainText - The message to encrypt
 * @param {CryptoKey} recipientPublicKey - Recipient's RSA Public Key
 */
export const encryptMessage = async (plainText, recipientPublicKey) => {
    if (!isCryptoSupported()) {
        console.warn("Encryption skipped: Crypto not supported in this context.");
        return { cipherText: plainText, iv: "", encryptedKey: "", isUnencrypted: true };
    }
    // 1. Generate a one-time AES key
    const aesKey = await window.crypto.subtle.generateKey(
        AES_ALGO,
        true,
        ["encrypt", "decrypt"]
    );

    // 2. Encrypt the plainText with AES-GCM
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedText = new TextEncoder().encode(plainText);
    const encryptedData = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        aesKey,
        encodedText
    );

    // 3. Encrypt the AES key with recipient's RSA Public Key
    const rawAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
    const encryptedAesKey = await window.crypto.subtle.encrypt(
        RSA_ALGO,
        recipientPublicKey,
        rawAesKey
    );

    return {
        cipherText: btoa(String.fromCharCode(...new Uint8Array(encryptedData))),
        iv: btoa(String.fromCharCode(...iv)),
        encryptedKey: btoa(String.fromCharCode(...new Uint8Array(encryptedAesKey))),
    };
};

/**
 * Encrypt one message for multiple recipients (group E2EE).
 * Uses one AES payload key and encrypts that key with each recipient's RSA public key.
 */
export const encryptMessageForRecipients = async (plainText, recipients) => {
    if (!isCryptoSupported()) {
        console.warn("Encryption skipped: Crypto not supported in this context.");
        return { cipherText: plainText, iv: "", encryptedKeys: {}, isUnencrypted: true };
    }

    const aesKey = await window.crypto.subtle.generateKey(
        AES_ALGO,
        true,
        ["encrypt", "decrypt"]
    );

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedText = new TextEncoder().encode(plainText);
    const encryptedData = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        aesKey,
        encodedText
    );

    const rawAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
    const encryptedKeys = {};

    for (const recipient of recipients) {
        if (!recipient?.userId || !recipient?.publicKeyB64) continue;
        const publicKey = await importPublicKey(recipient.publicKeyB64);
        const encryptedAesKey = await window.crypto.subtle.encrypt(
            RSA_ALGO,
            publicKey,
            rawAesKey
        );
        encryptedKeys[recipient.userId] = btoa(String.fromCharCode(...new Uint8Array(encryptedAesKey)));
    }

    return {
        cipherText: btoa(String.fromCharCode(...new Uint8Array(encryptedData))),
        iv: btoa(String.fromCharCode(...iv)),
        encryptedKeys,
    };
};

/**
 * Decrypts a message using the user's RSA Private Key
 */
export const decryptMessage = async (cipherText, encryptedKey, iv, privateKey) => {
    if (!isCryptoSupported() || !encryptedKey || !iv) {
        return cipherText; // Fallback or unencrypted message
    }
    try {
        // 1. Decrypt the AES key using user's RSA Private Key
        const encryptedAesKeyBinary = new Uint8Array(atob(encryptedKey).split("").map(c => c.charCodeAt(0)));
        const rawAesKey = await window.crypto.subtle.decrypt(
            RSA_ALGO,
            privateKey,
            encryptedAesKeyBinary
        );

        // 2. Import the AES key
        const aesKey = await window.crypto.subtle.importKey(
            "raw",
            rawAesKey,
            AES_ALGO,
            true,
            ["decrypt"]
        );

        // 3. Decrypt the cipherText using AES-GCM
        const ivBinary = new Uint8Array(atob(iv).split("").map(c => c.charCodeAt(0)));
        const encryptedDataBinary = new Uint8Array(atob(cipherText).split("").map(c => c.charCodeAt(0)));

        const decryptedContent = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: ivBinary },
            aesKey,
            encryptedDataBinary
        );

        return new TextDecoder().decode(decryptedContent);
    } catch (error) {
        // Some old/plain messages may contain stale encryption fields.
        // Avoid noisy runtime errors and return a safe fallback.
        console.warn("Decryption skipped due to invalid encryption payload.");
        return "[Unable to decrypt message]";
    }
};
