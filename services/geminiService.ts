import { GoogleGenAI } from "@google/genai";
import { Platform, Tone, Language, RefinementAction, ModelTier } from "../types";
import { PLATFORM_CONFIG, DEFAULT_IMAGE_MODEL, DEFAULT_TEXT_MODEL, PRO_IMAGE_MODEL, PRO_TEXT_MODEL, PRO_2_5_TEXT_MODEL } from "../constants";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please select a key.");
  }
  return new GoogleGenAI({ apiKey });
};

export const ensureApiKey = async (): Promise<boolean> => {
  const aistudio = (window as any).aistudio;
  if (aistudio) {
    try {
      await aistudio.openSelectKey();
      return true;
    } catch (e) {
      console.error("Key selection failed or cancelled", e);
      return false;
    }
  }
  return !!process.env.API_KEY;
};

export const checkApiKeyConnection = async (): Promise<boolean> => {
  const aistudio = (window as any).aistudio;
  if (aistudio) {
    return await aistudio.hasSelectedApiKey();
  }
  return !!process.env.API_KEY;
};

const getModelName = (tier: ModelTier): string => {
  switch (tier) {
    case 'flash-2.5': return DEFAULT_TEXT_MODEL;
    case 'pro-2.5': return PRO_2_5_TEXT_MODEL;
    case 'pro-3.0': return PRO_TEXT_MODEL;
    default: return DEFAULT_TEXT_MODEL;
  }
};

const getImageModelName = (tier: ModelTier): string => {
  // Pro 2.5 and Pro 3.0 use the high-quality image model
  if (tier === 'pro-2.5' || tier === 'pro-3.0') {
    return PRO_IMAGE_MODEL;
  }
  return DEFAULT_IMAGE_MODEL;
};

export const generatePlatformText = async (
  platform: Platform,
  topic: string,
  tone: Tone,
  language: Language,
  keywords: string,
  brandVoice: string,
  isThread: boolean,
  modelTier: ModelTier
): Promise<string> => {
  const ai = getAIClient();
  const model = getModelName(modelTier);

  let platformInstructions = '';
  switch (platform) {
    case Platform.LINKEDIN:
      platformInstructions = isThread 
        ? '- Create a carousel-style text breakdown (Slide 1, Slide 2, etc.). Professional and structured.'
        : '- Professional tone, structured, uses paragraphs. Approx 100-150 words.';
      break;
    case Platform.TWITTER:
      platformInstructions = isThread
        ? '- Create a numbered thread (1/X, 2/X). Punchy and concise per tweet.'
        : '- Under 280 characters. Punchy. Use 1-2 relevant hashtags.';
      break;
    case Platform.INSTAGRAM:
      platformInstructions = isThread
        ? '- Create text suitable for a carousel post (Slide 1, Slide 2...). Engaging hooks.'
        : '- Engaging hook, emoji friendly, includes a block of 5-10 relevant hashtags at the end.';
      break;
    case Platform.THREADS:
      platformInstructions = isThread
        ? '- Create a numbered thread. Conversational and authentic.'
        : '- Conversational, authentic tone. Can be up to 500 chars but keeping it concise is good. No hashtags or very few.';
      break;
  }

  const systemInstruction = `You are a social media expert. 
  Write a ${tone} post for ${platform} about the user's topic.
  
  Language: Write strictly in ${language}.
  
  Rules for ${platform}:
  ${platformInstructions}
  
  ${keywords ? `MUST INCLUDE these keywords: ${keywords}` : ''}
  ${brandVoice ? `Brand Voice/Style Instructions: ${brandVoice}` : ''}
  
  Do not include any preamble like "Here is the post". Just return the content.`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: topic,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });
    return response.text || "";
  } catch (error) {
    console.error(`Error generating text for ${platform}:`, error);
    throw error;
  }
};

export const refineContent = async (
  platform: Platform,
  currentText: string,
  action: RefinementAction,
  tone: Tone,
  language: Language,
  modelTier: ModelTier
): Promise<string> => {
  const ai = getAIClient();
  const model = getModelName(modelTier);
  
  const refinementPrompts: Record<RefinementAction, string> = {
    shorten: 'Shorten this significantly while keeping the core message.',
    expand: 'Expand on this with more details, examples, or emotional depth.',
    funnier: 'Make this funnier, wittier, and more lighthearted.',
    rewrite: 'Rewrite this completely with a fresh perspective but same meaning.'
  };

  const systemInstruction = `You are a social media editor.
  Platform: ${platform}
  Target Tone: ${tone}
  Language: ${language}
  
  Task: ${refinementPrompts[action]}
  
  Maintain platform best practices (length, hashtags, formatting).
  Return ONLY the refined text.`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: `Original Text:\n${currentText}`,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });
    return response.text || "";
  } catch (error) {
    console.error(`Error refining text for ${platform}:`, error);
    throw error;
  }
};

export const generatePlatformImage = async (
  platform: Platform,
  topic: string,
  contextText: string,
  tone: Tone,
  modelTier: ModelTier
): Promise<string> => {
  const ai = getAIClient();
  const model = getImageModelName(modelTier);
  
  // We use the text content to inform the image generation for better alignment
  const prompt = `Create a high-quality, photorealistic image to accompany a social media post.
  
  Topic: ${topic}
  Vibe/Tone: ${tone}
  
  Context from the post text: "${contextText.substring(0, 300)}..."
  
  The image should be optimized for ${platform} audiences. 
  No text overlays on the image. High fidelity, cinematic lighting.`;

  const aspectRatio = PLATFORM_CONFIG[platform].aspectRatio;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
        }
      }
    });

    // Parse response for image data
    for (const candidate of response.candidates || []) {
      for (const part of candidate.content.parts) {
        if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
           return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image data found in response");
  } catch (error) {
    console.error(`Error generating image for ${platform}:`, error);
    throw error;
  }
};