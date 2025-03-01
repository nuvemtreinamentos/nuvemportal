import OpenAI from "openai";
import { db } from "./db";
import { sql } from "drizzle-orm";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function findStoredImage(keywords: string[]): Promise<string> {
  const CAR_PLACEHOLDER = "https://cdn.jsdelivr.net/npm/boxicons@2.1.4/svg/regular/bx-car.svg";

  try {
    console.log('Searching for images with keywords:', keywords);

    // Format keywords for SQL array
    const formattedKeywords = keywords.map(k => `'${k}'`).join(',');

    const query = sql`
      SELECT image_url
      FROM educational_images
      WHERE keywords && ARRAY[${formattedKeywords}]::text[]
      ORDER BY RANDOM()
      LIMIT 1
    `;

    console.log('Executing query:', query.toString());

    const { rows } = await db.execute(query);
    console.log('Query result rows:', rows);

    if (!rows.length || !rows[0].image_url) {
      console.log('No matching image found in the database, returning car placeholder');
      return CAR_PLACEHOLDER;
    }

    console.log('Found matching image:', rows[0].image_url);
    return rows[0].image_url;
  } catch (error) {
    console.error('Error searching for stored image:', error);
    return CAR_PLACEHOLDER;
  }
}

export async function processUserInput(input: string): Promise<{
  response: string;
  type: "code" | "image" | "text";
  codeSnippet?: string;
  language?: string;
  imageUrl?: string;
}> {
  try {
    console.log('Processing user input:', input);
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Você é um tutor de IA especializado em programação e inglês.
          Responda sempre em português do Brasil de forma clara e didática.`
        },
        { role: "user", content: input }
      ]
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    console.log('OpenAI response:', content);

    return {
      response: content,
      type: "text"
    };
  } catch (error) {
    console.error('Error in processUserInput:', error);
    throw error;
  }
}

export async function textToSpeech(text: string): Promise<ArrayBuffer> {
  try {
    console.log('Converting text to speech:', text);
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text
    });

    const buffer = await response.arrayBuffer();
    console.log('Successfully generated speech');
    return buffer;
  } catch (error) {
    console.error('Error in textToSpeech:', error);
    throw error;
  }
}