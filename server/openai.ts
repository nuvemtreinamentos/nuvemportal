import OpenAI from "openai";
import { db } from "./db";
import { sql } from "drizzle-orm";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function findStoredImage(keywords: string[]): Promise<string> {
  try {
    console.log('Searching for images with keywords:', keywords);

    // Use array literal syntax for PostgreSQL
    const query = sql`
      SELECT image_url
      FROM educational_images
      WHERE keywords && ${sql`ARRAY[${sql.join(keywords)}]::text[]`}
      ORDER BY RANDOM()
      LIMIT 1
    `;

    console.log('Executing query:', query.toString());

    const result = await db.execute(query);
    const rows = result as Array<{ image_url: string }>;

    console.log('Query result:', rows[0]);

    if (!rows.length || !rows[0].image_url) {
      console.log('No matching image found, returning placeholder');
      return "https://cdn.jsdelivr.net/npm/boxicons@2.1.4/svg/regular/bx-image.svg";
    }

    console.log('Found matching image:', rows[0].image_url);
    return rows[0].image_url;
  } catch (error) {
    console.error('Error searching for stored image:', error);
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
          "keywords": ["palavra1", "palavra2"] (apenas para imagens, use palavras-chave em inglês ou português)
        }

        Para imagens, use palavras-chave em inglês ou português, por exemplo:
        - Para carros: ["car", "vehicle", "automobile"] ou ["carro", "veículo", "automóvel"]
        - Para computadores: ["computer", "laptop"] ou ["computador", "notebook"]
        - Para livros: ["book", "reading"] ou ["livro", "leitura"]
        - Para código: ["code", "programming"] ou ["código", "programação"]

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
    console.log('Parsed OpenAI response:', result);

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
      console.log('Looking for image with keywords:', result.keywords);
      const imageUrl = await findStoredImage(result.keywords);
      console.log('Found image URL:', imageUrl);

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