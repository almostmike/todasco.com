import { llmsTxt, textResponse } from '../lib/llms';

export async function GET() {
  return textResponse(llmsTxt());
}
