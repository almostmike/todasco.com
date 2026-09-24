import { llmsFullTxt, textResponse } from '../lib/llms';

export async function GET() {
  return textResponse(llmsFullTxt());
}
