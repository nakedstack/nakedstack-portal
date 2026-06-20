import OpenAI from 'openai';

const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';

let clientInstance: OpenAI | null = null;

export function getDeepSeekClient(): OpenAI {
  if (!clientInstance) {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY environment variable is not set');
    }
    clientInstance = new OpenAI({
      baseURL: DEEPSEEK_BASE_URL,
      apiKey,
    });
  }
  return clientInstance;
}
