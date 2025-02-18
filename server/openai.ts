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
        content: `You are an AI tutor specializing in programming and English. 
        Respond in the following JSON format:
        {
          "type": "code" | "image" | "text",
          "content": "your response text here",
          "language": "programming language (for code only)",
          "imagePrompt": "image generation prompt (for image only)"
        }

        Guidelines:
        - For programming questions: set type="code", include code in content, specify language
        - For visual concepts: set type="image", include description in content, provide imagePrompt
        - For other questions: set type="text", provide explanation in content
        - Keep responses concise and focused`
      },
      { role: "user", content: input }
    ],
    response_format: { type: "json_object" }
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  try {
    const result = JSON.parse(content);

    if (!result.type || !result.content || 
        !["code", "image", "text"].includes(result.type)) {
      throw new Error("Invalid response format from OpenAI");
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

      return {
        ...output,
        imageUrl: image.data[0].url
      };
    }

    return output;
  } catch (error) {
    throw new Error(`Failed to parse OpenAI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function textToSpeech(text: string): Promise<ArrayBuffer> {
  const response = await openai.audio.speech.create({
    model: "tts-1",
    voice: "alloy",
    input: text,
  });

  return await response.arrayBuffer();
}