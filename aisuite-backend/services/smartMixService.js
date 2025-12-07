const Groq = require("groq-sdk");
const { buildAllPrompts } = require("../utils/promptHelper.js");
const log = require('../utils/logger');

// Load Groq API key
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Default Groq model you tested successfully
const GROQ_MODEL = process.env.GROQ_MODEL;

// ----------------------------------------
// CALL GROQ API
// ----------------------------------------
async function callGroqAPI(prompt, label) {
    log('INFO', `[Service] Calling GROQ for "${label}"...`);

    try {
        const response = await groq.chat.completions.create({
            model: GROQ_MODEL,
            messages: [
                { role: "user", content: prompt }
            ]
        });

        const text = response.choices?.[0]?.message?.content || "";
        log('INFO', `[Service] ✅ GROQ Success for "${label}"`);
        return text;

    } catch (error) {
        log('ERROR', `[Service] ❌ GROQ Error for "${label}"`, error.message);
        return `Error generating ${label} response.`;
    }
}


// ----------------------------------------
// MAIN SMART MIX
// ----------------------------------------
async function smartMix(
    input,
    type = "text",
    history = [],
    activeModels = ['chatGPT', 'gemini', 'claude'] // <-- gemini now maps to Groq
) {

    log('INFO',
        `[Service] Processing request. Type: "${type}", History: ${history.length}, Models: [${activeModels.join(', ')}]`
    );

    // 1️⃣ Prepare conversation history
    let fullContextInput = input;

    if (history && history.length > 0) {
        let historyStr = "Conversation History:\n";
        history.forEach(msg => {
            historyStr += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
        });

        historyStr += `\nUser's New Question:\n${input}`;
        fullContextInput = historyStr;

        log('INFO', '[Service] History context appended.');
    }

    // 2️⃣ Build prompts
    const prompts = buildAllPrompts(fullContextInput, type);

    // 3️⃣ Model definitions now point to GROQ instead of Gemini
    const modelDefinitions = {
        chatGPT: { prompt: prompts.chatGPT, label: "ChatGPT" }, // still handled by groq for now
        gemini:  { prompt: prompts.gemini,  label: "Groq" },    // gemini slot replaced by Groq
        claude:  { prompt: prompts.claude,  label: "Claude" }   // still optional
    };

    const promises = [];
    const keys = [];

    // Map all calls to Groq
    activeModels.forEach(modelKey => {
        if (modelDefinitions[modelKey]) {
            const def = modelDefinitions[modelKey];
            promises.push(callGroqAPI(def.prompt, def.label)); // ALWAYS Groq
            keys.push(modelKey);
        }
    });

    // 4️⃣ Execute calls in parallel
    const startTime = Date.now();
    const finalResults = {};

    try {
        if (promises.length === 0) {
            log('WARN', '[Service] No valid models selected in activeModels array.');
            return {};
        }

        const responses = await Promise.all(promises);

        responses.forEach((response, index) => {
            const key = keys[index];
            finalResults[key] = response;
        });

    } catch (error) {
        log('ERROR', "[Service] Critical failure in parallel calls", error.message);
        throw new Error(`AI processing failed: ${error.message}`);
    }

    const duration = Date.now() - startTime;
    log('INFO', `[Service] 🏁 Generated ${keys.length} outputs in ${duration}ms`);

    return finalResults;
}

module.exports = { smartMix };
