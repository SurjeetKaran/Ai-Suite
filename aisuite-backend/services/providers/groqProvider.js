const Groq = require("groq-sdk");
const { 
    selectKey, 
    updateKeyUsage, 
    markKeyFailed 
} = require("../../utils/keyBalancer");
const LoadBalancerConfig = require("../../models/LoadBalancerConfig");
const log = require("../../utils/logger");

const PROVIDER = "groq";

async function callGroqProvider(prompt, label) {
    log("INFO", `[GroqProvider] Selecting API key for "${label}"...`);

    const MODEL =
        global.SystemEnv?.GROQ_MODEL ||
        process.env.GROQ_MODEL ||
        "llama-3.3-70b-versatile";

    const lbConfig = await LoadBalancerConfig.findOne() || { retryCount: 1 };
    const maxRetries = lbConfig.retryCount;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        let selectedKey = null;

        try {
            selectedKey = await selectKey(PROVIDER);

            if (!selectedKey?.key) {
                throw new Error("Groq API key missing. Add in Admin → System Settings.");
            }

            log("INFO", `[GroqProvider] Using key "${selectedKey.label}" (attempt ${attempt})`, {
                keyId: selectedKey._id
            });

            const groq = new Groq({ apiKey: selectedKey.key });

            const response = await groq.chat.completions.create({
                model: MODEL,
                messages: [{ role: "user", content: prompt }]
            });

            const outputText = response?.choices?.[0]?.message?.content || "";
            const tokensUsed = response?.usage?.total_tokens || 0;

            await updateKeyUsage(selectedKey._id, tokensUsed);

            log("INFO", `[GroqProvider] ✓ Success for "${label}"`, { tokensUsed });

            // 🔥 RETURN TOKEN COUNT SO SMARTMIX CAN SAVE IT
            return { text: outputText, tokensUsed };

        } catch (error) {
            log("ERROR", `[GroqProvider] Error for "${label}"`, {
                attempt,
                error: error.message
            });

            if (selectedKey?._id) {
                await markKeyFailed(selectedKey._id, error.message);
            }

            if (attempt <= maxRetries) {
                log("WARN", `[GroqProvider] Retrying with another key for "${label}"...`);
                continue;
            }

            return { text: `Error generating output for ${label}.`, tokensUsed: 0 };
        }
    }
}

module.exports = { callGroqProvider };


