import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
          "imagePrompt": "prompt detalhado para geração de imagem (apenas para imagem)"
        }

        Diretrizes:
        - Para perguntas de programação: type="code", inclua o código em content, especifique a language
        - Para conceitos visuais ou quando uma visualização ajudaria: type="image", inclua explicação em content, forneça imagePrompt detalhado
        - Para outras perguntas: type="text", forneça explicação em content
        - Mantenha as respostas concisas e focadas

        Para geração de imagens:
        - Crie prompts detalhados e claros que especifiquem estilo, composição e detalhes importantes
        - Foque em diagramas educacionais e explicações visuais
        - Evite interpretações abstratas ou artísticas, a menos que especificamente solicitado`
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

    if (result.type === "image" && result.imagePrompt) {
      const image = await openai.images.generate({
        model: "dall-e-3",
        prompt: result.imagePrompt,
        n: 1,
        size: "1024x1024"
      });

      if (!image.data[0].url) {
        throw new Error("Falha ao gerar imagem");
      }

      return {
        ...output,
        imageUrl: image.data[0].url
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