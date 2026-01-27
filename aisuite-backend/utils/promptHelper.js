/**
 * Build a MODULE-SPECIFIC prompt
 * Prompt is independent of model/provider
 *
 * @param {string} input - User input (or history-injected input)
 * @param {string} type - Module type: "CareerGPT", "StudyGPT", "ContentGPT"
 */
function buildModulePrompt(input, type) {
  // Global constraint applied to all modules
  const constraint = "Keep your response concise and under 200 words.";

  switch (type) {
    case "CareerGPT":
      return (
        `You are an expert career assistant. ` +
        `Improve resumes, job descriptions, and career-related content. ` +
        `${constraint}\n\n${input}`
      );

    case "StudyGPT":
      return (
        `You are a knowledgeable study assistant. ` +
        `Explain concepts clearly, summarize content, and help with exam preparation. ` +
        `${constraint}\n\n${input}`
      );

    case "ContentGPT":
      return (
        `You are a creative content assistant. ` +
        `Generate engaging social media posts, ads, captions, and content ideas. ` +
        `${constraint}\n\n${input}`
      );

    default:
      return (
        `You are a helpful AI assistant. ` +
        `${constraint}\n\n${input}`
      );
  }
}

module.exports = { buildModulePrompt };

