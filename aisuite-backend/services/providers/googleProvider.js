const { selectKey, updateKeyUsage, markKeyFailed } = require("../../utils/keyBalancer");
const log = require("../../utils/logger");

/**
 * Call Google Gemini API
 * @param {string} prompt - The user prompt
 * @param {string} modelName - Model identifier (e.g., "gemini-2.0-flash")
 */
async function callGoogleProvider(prompt, modelName) {
  let keyData;
  
  try {
    keyData = await selectKey("google");

    log("INFO", "Calling Google Gemini API", {
      model: modelName,
      keyLabel: keyData.label
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": keyData.key
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Extract text from response
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

    // Extract token usage
    const tokensUsed = 
      (data.usageMetadata?.promptTokenCount || 0) + 
      (data.usageMetadata?.candidatesTokenCount || 0);

    await updateKeyUsage(keyData._id, tokensUsed);

    log("INFO", "Google Gemini API success", {
      model: modelName,
      tokensUsed
    });

    return {
      text,
      tokensUsed
    };

  } catch (err) {
    log("ERROR", "Google Gemini API failed", {
      model: modelName,
      error: err.message
    });

    if (keyData) {
      await markKeyFailed(keyData._id, err.message);
    }

    throw err;
  }
}

module.exports = { callGoogleProvider };
