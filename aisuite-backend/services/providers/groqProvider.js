const { selectKey, updateKeyUsage, markKeyFailed } = require("../../utils/keyBalancer");
const log = require("../../utils/logger");

/**
 * Call Groq API
 * @param {string} prompt - The user prompt
 * @param {string} modelName - Model identifier (e.g., "mixtral-8x7b-32768")
 */
async function callGroqProvider(prompt, modelName) {
  let keyData;
  
  try {
    keyData = await selectKey("groq");

    log("INFO", "Calling Groq API", {
      model: modelName,
      keyLabel: keyData.label
    });

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${keyData.key}`
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2048
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Extract text from response
    const text = data.choices?.[0]?.message?.content || "No response";

    // Extract token usage
    const tokensUsed = 
      (data.usage?.prompt_tokens || 0) + 
      (data.usage?.completion_tokens || 0);

    await updateKeyUsage(keyData._id, tokensUsed);

    log("INFO", "Groq API success", {
      model: modelName,
      tokensUsed
    });

    return {
      text,
      tokensUsed
    };

  } catch (err) {
    log("ERROR", "Groq API failed", {
      model: modelName,
      error: err.message
    });

    if (keyData) {
      await markKeyFailed(keyData._id, err.message);
    }

    throw err;
  }
}

module.exports = { callGroqProvider };
