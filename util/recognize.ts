import { tesseract } from "../deps.ts";

export async function recognize(path: string, lang?: 'eng' | 'pgo'): Promise<string> {
  const text = await tesseract.recognize(path, {
    lang: lang ?? 'pgo'
  });
  return text;
}
