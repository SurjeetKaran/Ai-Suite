/**
 * Build distinct prompts for ChatGPT, Gemini, Claude
 * Enforces a 200-word limit on all outputs.
 * * @param {string} input - Raw user input (or history context)
 * @param {string} type - Module type: "CareerGPT", "StudyGPT", "ContentGPT"
 */
function buildAllPrompts(input, type) {
  let chatGPTPrompt, geminiPrompt, claudePrompt;
  
  // Common constraint to append to all prompts
  const constraint = "Keep your response concise and under 200 words.";

  switch (type) {
    case "CareerGPT":
      chatGPTPrompt = `You are ChatGPT. Improve this resume or job-related text. ${constraint}:\n${input}`;
      geminiPrompt = `You are Gemini. Generate professional resume improvements. ${constraint}:\n${input}`;
      claudePrompt = `You are Claude. Create interview/assessment insights for this resume. ${constraint}:\n${input}`;
      break;

    case "StudyGPT":
      chatGPTPrompt = `You are ChatGPT. Summarize and explain in simple terms. ${constraint}:\n${input}`;
      geminiPrompt = `You are Gemini. Provide detailed summary, key points, and likely questions. ${constraint}:\n${input}`;
      claudePrompt = `You are Claude. Convert this into exam-style Q&A or easy explanations. ${constraint}:\n${input}`;
      break;

    case "ContentGPT":
      chatGPTPrompt = `You are ChatGPT. Create social media copy for the following. ${constraint}:\n${input}`;
      geminiPrompt = `You are Gemini. Generate creative ad captions, reels, or posts. ${constraint}:\n${input}`;
      claudePrompt = `You are Claude. Suggest engaging content ideas or templates for this input. ${constraint}:\n${input}`;
      break;

    default:
      chatGPTPrompt = `You are ChatGPT. Process this input. ${constraint}:\n${input}`;
      geminiPrompt = `You are Gemini. Process this input. ${constraint}:\n${input}`;
      claudePrompt = `You are Claude. Process this input. ${constraint}:\n${input}`;
      break;
  }

  return {
    chatGPT: chatGPTPrompt,
    gemini: geminiPrompt,
    claude: claudePrompt,
  };
}

// ❌ Removed buildSmartMixPrompt as it is no longer used

module.exports = { buildAllPrompts };
