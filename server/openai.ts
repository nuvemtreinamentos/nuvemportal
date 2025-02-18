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
          If the user asks a programming question, provide code examples.
          If they ask about visual concepts, suggest generating an image.
          Otherwise, provide a text explanation.
          Format response as JSON with fields: type (code|image|text), content, language (for code), imagePrompt (for images)`
      },
      { role: "user", content: input }
    ],
    response_format: { type: "json_object" }
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  const result = JSON.parse(content);

  let output = {
    response: result.content,
    type: result.type as "code" | "image" | "text"
  };

  if (result.type === "code") {
    return {
      ...output,
      codeSnippet: result.content,
      language: result.language
    };
  }

  if (result.type === "image") {
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
}

export async function textToSpeech(text: string): Promise<ArrayBuffer> {
  const response = await openai.audio.speech.create({
    model: "tts-1",
    voice: "alloy",
    input: text,
  });

  return await response.arrayBuffer();
}