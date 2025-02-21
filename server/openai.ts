import OpenAI from "openai";
import { db } from "./db";
import { sql } from "drizzle-orm";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function findStoredImage(keywords: string[]): Promise<string | null> {
  try {
    // Search for images where any of the keywords match
    const [result] = await db.execute<{ image_url: string }>(sql`
      SELECT image_url
      FROM educational_images
      WHERE keywords && ${keywords}::text[]
      ORDER BY RANDOM()
      LIMIT 1
    `);

    return result?.image_url || null;
  } catch (error) {
    console.error('Error searching for stored image:', error);
    return null;
  }
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
export async function processUserInput(input: string): Promise<{
  response: string;
  type: "code" | "image" | "text";
  codeSnippet?: string;
  language?: string;
  imageUrl?: string;
}> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `Você é um tutor de IA especializado em programação e inglês.
        Responda sempre em português do Brasil.
        Quando os usuários solicitarem visualizações, diagramas ou perguntarem sobre conceitos visuais,
        sempre gere uma imagem para ajudar a explicar o conceito.

        Responda no seguinte formato JSON:
        {
          "type": "code" | "image" | "text",
          "content": "sua resposta aqui",
          "language": "linguagem de programação (apenas para código)",
          "keywords": ["palavra1", "palavra2"] (apenas para imagens, máximo 5 palavras-chave relevantes)
        }

        Diretrizes:
        - Para perguntas de programação: type="code", inclua o código em content, especifique a language
        - Para conceitos visuais ou quando uma visualização ajudaria: type="image", forneça explicação em content e keywords relevantes
        - Para outras perguntas: type="text", forneça explicação em content
        - Mantenha as respostas concisas e focadas`
      },
      { role: "user", content: input }
    ],
    response_format: { type: "json_object" }
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("Sem resposta da OpenAI");
  }

  try {
    const result = JSON.parse(content);

    if (!result.type || !result.content || 
        !["code", "image", "text"].includes(result.type)) {
      throw new Error("Formato de resposta inválido da OpenAI");
    }

    let output = {
      response: result.content,
      type: result.type as "code" | "image" | "text"
    };

    if (result.type === "code" && result.language) {
      return {
        ...output,
        codeSnippet: result.content,
        language: result.language
      };
    }

    if (result.type === "image") {
      // First try to find a stored image if keywords are provided
      let imageUrl = null;
      if (result.keywords && Array.isArray(result.keywords)) {
        imageUrl = await findStoredImage(result.keywords);
      }

      // If no stored image is found, fallback to DALL-E
      if (!imageUrl) {
        console.log('No stored image found, using DALL-E');
        const image = await openai.images.generate({
          model: "dall-e-3",
          prompt: result.content,
          n: 1,
          size: "1024x1024"
        });

        if (!image.data[0].url) {
          throw new Error("Falha ao gerar imagem");
        }

        imageUrl = image.data[0].url;
      }

      return {
        ...output,
        imageUrl
      };
    }

    return output;
  } catch (error) {
    throw new Error(`Falha ao processar resposta da OpenAI: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

export async function textToSpeech(text: string): Promise<ArrayBuffer> {
  const response = await openai.audio.speech.create({
    model: "tts-1",
    voice: "alloy",
    input: text,
    language: "pt", // Set language to Portuguese
  });

  return await response.arrayBuffer();
}