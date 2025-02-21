import OpenAI from "openai";
import { db } from "./db";
import { sql } from "drizzle-orm";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function findStoredImage(keywords: string[]): Promise<string> {
  try {
    // Search for images where any of the keywords match
    const [result] = await db.execute<{ image_url: string }>(sql`
      SELECT image_url
      FROM educational_images
      WHERE keywords && ${sql.array(keywords, 'text')}
      ORDER BY RANDOM()
      LIMIT 1
    `);

    if (!result?.image_url) {
      // Return a default placeholder image if no match is found
      return "https://cdn.jsdelivr.net/npm/boxicons@2.1.4/svg/regular/bx-image.svg";
    }

    return result.image_url;
  } catch (error) {
    console.error('Error searching for stored image:', error);
    // Return default image in case of error
    return "https://cdn.jsdelivr.net/npm/boxicons@2.1.4/svg/regular/bx-image.svg";
  }
}

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
        Quando os usuários solicitarem visualizações ou diagramas, use palavras-chave
        para encontrar imagens relevantes em nossa biblioteca.

        Responda no seguinte formato JSON:
        {
          "type": "code" | "image" | "text",
          "content": "sua resposta aqui",
          "language": "linguagem de programação (apenas para código)",
          "keywords": ["palavra1", "palavra2"] (apenas para imagens, use palavras-chave simples e diretas)
        }

        Para imagens, use palavras-chave simples e diretas, por exemplo:
        - Para carros: ["car", "vehicle", "automobile"]
        - Para computadores: ["computer", "laptop", "desktop"]
        - Para livros: ["book", "reading", "education"]
        - Para código: ["code", "programming", "development"]

        Diretrizes:
        - Para perguntas de programação: type="code", inclua o código em content, especifique a language
        - Para conceitos visuais: type="image", forneça explicação em content e keywords relevantes
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
      if (!result.keywords || !Array.isArray(result.keywords)) {
        result.keywords = ['placeholder'];
      }
      console.log('Searching for image with keywords:', result.keywords);
      const imageUrl = await findStoredImage(result.keywords);
      console.log('Found stored image:', imageUrl);

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
    input: text
  });

  return await response.arrayBuffer();
}