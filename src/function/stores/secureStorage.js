const SECRET_KEY = "MaCléUltraSecrète!2025"; // ⚠️ idéalement dans .env

// 🔑 Fonction pour générer une clé à partir de la chaîne secrète
async function getKey() {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(SECRET_KEY),
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: enc.encode("salt123"), // tu peux changer le sel pour plus de sécurité
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

// 🔒 Fonction de chiffrement
export async function encrypt(value) {
    if (!value) return null;
    const key = await getKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        enc.encode(value)
    );

    // on retourne iv + données chiffrées, encodé en base64
    const buffer = new Uint8Array(encrypted);
    const combined = new Uint8Array(iv.length + buffer.length);
    combined.set(iv);
    combined.set(buffer, iv.length);

    return btoa(String.fromCharCode(...combined));
}

// 🔓 Fonction de déchiffrement
export async function decrypt(cipherText) {
    try {
        const key = await getKey();
        const combined = Uint8Array.from(atob(cipherText), c => c.charCodeAt(0));
        const iv = combined.slice(0, 12);
        const data = combined.slice(12);

        const decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            key,
            data
        );

        const dec = new TextDecoder();
        return dec.decode(decrypted);
    } catch {
        return null;
    }
}

// 🧰 Fonctions de manipulation sécurisée du localStorage
export async function setSecureItem(key, value) {
    try {
        const jsonValue = typeof value === "string" ? value : JSON.stringify(value);
        const encrypted = await encrypt(jsonValue);
        localStorage.setItem(key, encrypted);
    } catch (err) {
        console.error("Erreur setSecureItem:", err);
    }
}

export async function getSecureItem(key) {
    try {
        const encrypted = localStorage.getItem(key);
        if (!encrypted) return null;

        const decrypted = await decrypt(encrypted);
        try {
            return decrypted;
        } catch {
            return decrypted;
        }
    } catch (err) {
        console.error("Erreur getSecureItem:", err);
        return null;
    }
}

export function removeSecureItem(key) {
    localStorage.removeItem(key);
}

export function clearSecureStorage() {
    localStorage.clear();
}
