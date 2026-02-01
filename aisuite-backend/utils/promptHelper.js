/**
 * Build a MODULE-SPECIFIC prompt
 * Prompt is independent of model/provider
 *
 * @param {string} input - User input (or history-injected input)
 * @param {string} type - Module type: "CareerGPT", "StudyGPT", "ContentGPT"
 */
function buildModulePrompt(input, type) {
  // Global formatting instructions
  const formattingRules = `

FORMATTING RULES:
- Use markdown formatting for better readability
- Use **bold** for important terms or emphasis
- Use *italic* for definitions or subtle emphasis
- Use bullet points (- or *) for lists
- Use numbered lists (1., 2., 3.) for steps or sequences
- Use headings (##, ###) to structure longer responses
- Use > for quotes or important callouts
- For code, use markdown code blocks with language specification:
  \`\`\`language
  code here
  \`\`\`
- Keep responses well-structured and scannable
`;

  switch (type) {
    case "CareerGPT":
      return (
        `You are an expert career assistant. ` +
        `Improve resumes, job descriptions, and career-related content. ` +
        `Provide actionable advice with clear structure.` +
        `${formattingRules}\n\n${input}`
      );

    case "StudyGPT":
      return (
        `You are a knowledgeable study assistant. ` +
        `Explain concepts clearly, summarize content, and help with exam preparation. ` +
        `Break down complex topics into digestible sections. ` +
        `Use examples and analogies when helpful.` +
        `${formattingRules}\n\n${input}`
      );

    case "ContentGPT":
      return (
        `You are a creative content assistant. ` +
        `Generate engaging social media posts, ads, captions, and content ideas. ` +
        `Be creative and compelling while maintaining clarity.` +
        `${formattingRules}\n\n${input}`
      );

    default:
      return (
        `You are a helpful AI assistant. ` +
        `Provide clear, well-formatted responses.` +
        `${formattingRules}\n\n${input}`
      );
  }
}

module.exports = { buildModulePrompt };

