// @ts-check
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.GEMINI_API_KEY || "";
const MODEL_NAME = "gemini-2.5-flash";
const MAX_OUTPUT_TOKENS = 1024;

/** @type {GoogleGenerativeAI | null} */
let genAIInstance = null;

/** @returns {GoogleGenerativeAI} */
function getClient() {
  if (!genAIInstance) {
    if (!API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }
    genAIInstance = new GoogleGenerativeAI(API_KEY);
  }
  return genAIInstance;
}

/**
 * @param {string} systemInstruction
 * @param {Array<{role: string, parts: Array<{text: string}>}>} contents
 * @returns {Promise<string>}
 */
async function generate(systemInstruction, contents) {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction,
    generationConfig: {
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.7,
    },
  });

  const result = await model.generateContent({ contents });
  const text = result.response.text();
  return text;
}

module.exports = { generate };
