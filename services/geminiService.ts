import { GoogleGenAI, Type, Schema } from "@google/genai";
import { VideoAnalysisResult, ScriptVariant, ScriptRow, Language, Duration } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Helpers ---

export async function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string } }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onloadend = () => {
      // 1. Check for FileReader errors
      if (reader.error) {
        reject(new Error(`FileReader failed: ${reader.error.message}`));
        return;
      }

      // 2. Check for null result
      const base64Data = reader.result as string;
      if (!base64Data) {
        reject(new Error("FileReader result is empty or null"));
        return;
      }

      // 3. Safe split
      const parts = base64Data.split(',');
      if (parts.length < 2) {
         reject(new Error("Invalid Data URL format from FileReader"));
         return;
      }
      
      const base64Content = parts[1];
      
      let mimeType = file.type;
      if (!mimeType || mimeType === "") {
        if (file.name.toLowerCase().endsWith(".heic")) mimeType = "image/heic";
        else if (file.name.toLowerCase().endsWith(".heif")) mimeType = "image/heif";
        else if (file.name.toLowerCase().endsWith(".webp")) mimeType = "image/webp";
        // Fallback or leave empty to let API infer/fail
      }

      resolve({
        inlineData: {
          data: base64Content,
          mimeType: mimeType || file.type || "application/octet-stream", 
        },
      });
    };

    reader.onerror = () => reject(new Error(`FileReader error event: ${reader.error?.message}`));
    
    try {
      reader.readAsDataURL(file);
    } catch (e) {
      reject(e);
    }
  });
}

// --- Video Analysis ---

export async function analyzeVideoContent(videoFile: File): Promise<VideoAnalysisResult> {
  const videoPart = await fileToGenerativePart(videoFile);

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      scenes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            startTime: { type: Type.STRING, description: "Start time format MM:SS" },
            endTime: { type: Type.STRING, description: "End time format MM:SS" },
            description: { type: Type.STRING },
            category: { type: Type.STRING, enum: ['Product Info', 'Usage', 'Benefits', 'Hook', 'CTA', 'Other'] },
            transcriptOriginal: { type: Type.STRING },
            transcriptTranslation: { type: Type.STRING, description: "Translated to Simplified Chinese" },
            rawStartTime: { type: Type.NUMBER, description: "Start time in seconds" },
          },
          required: ["startTime", "endTime", "description", "category", "transcriptOriginal", "transcriptTranslation", "rawStartTime"],
        },
      },
      features: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            translation: { type: Type.STRING, description: "Translated to Simplified Chinese" },
          },
          required: ["text", "translation"],
        },
      },
      visualStyle: { type: Type.STRING, description: "e.g., High-Key Minimalist, Gritty Urban" },
      pacing: { type: Type.STRING, description: "e.g., Fast-paced, Slow & Emotional" },
      colorGrade: { type: Type.STRING, description: "e.g., Warm Vintage, Cool Cyberpunk" },
    },
    required: ["scenes", "features", "visualStyle", "pacing", "colorGrade"],
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        videoPart,
        { text: "Analyze this video. Break it down into scenes. Extract key selling points/features. Translate transcripts and features to Simplified Chinese. Analyze the overall visual style, pacing, and color grading." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  if (!response.text) {
    throw new Error("No response from AI");
  }

  return JSON.parse(response.text) as VideoAnalysisResult;
}

// --- Image Generation (Product Grid) ---

export async function generateProductGrid(imageParts: any[], description: string): Promise<string> {
  const prompt = `
    Create a "9-grid reference sheet" (3x3 grid layout) based STRICTLY on the provided product images.
    
    CRITICAL: The generated product MUST LOOK IDENTICAL to the input images provided. 
    - Maintain exact color, branding, logos, materials, and shape.
    - Do not redesign or alter the product's appearance.
    - Use the provided description only for context: "${description}".

    Layout Requirements:
    - 3x3 Grid (9 panels total) on a pure WHITE BACKGROUND.
    - Include: Front view, Back view, Side profiles, Top view, and Extreme Close-ups of textures.
    - Style: High-end E-commerce Product Photography, Studio Lighting, 4K Resolution.
    - No text overlays, No props.
    - Output Aspect Ratio: 9:16 Vertical.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [
        ...imageParts,
        { text: prompt }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: "9:16",
        imageSize: "4K"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return part.inlineData.data;
    }
  }
  throw new Error("No image generated");
}

// --- Script Generation ---

export async function generateScriptAndPrompt(
  imageParts: any[],
  analysis: VideoAnalysisResult,
  selectedFeatures: string[],
  productDescription: string,
  language: Language,
  duration: Duration,
  sceneCount: number,
  variantCount: number
): Promise<ScriptVariant[]> {
  
  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        name: { type: Type.STRING },
        soraPrompt: { type: Type.STRING },
        soraPromptTranslation: { type: Type.STRING },
        script: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              timeframe: { type: Type.STRING },
              visual: { type: Type.STRING },
              visualTranslation: { type: Type.STRING },
              shotType: { type: Type.STRING, description: "e.g., Extreme Close-up, Wide Angle" },
              movement: { type: Type.STRING, description: "e.g., Slow Pan Right, Handheld Shake" },
              lighting: { type: Type.STRING, description: "e.g., Golden Hour, Studio Softbox" },
              audio: { type: Type.STRING },
              audioTranslation: { type: Type.STRING },
              style: { type: Type.STRING },
            },
            required: ["id", "timeframe", "visual", "visualTranslation", "shotType", "movement", "lighting", "audio", "audioTranslation", "style"]
          }
        }
      },
      required: ["id", "name", "soraPrompt", "soraPromptTranslation", "script"]
    }
  };

  const prompt = `
    You are a viral TikTok content strategist and director.
    Based on the reference video structure and the selected features, create ${variantCount} distinct script variants for the product.
    
    Product Description: ${productDescription}
    Selected Features: ${selectedFeatures.join(', ')}
    Target Language: ${language}
    Target Duration: ${duration}
    Scene Count: ${sceneCount}
    
    Reference Video Structure (Emulate this flow):
    ${JSON.stringify(analysis.scenes.map(s => `${s.category}: ${s.description}`))}
    
    Reference Style:
    - Pacing: ${analysis.pacing}
    - Visual Style: ${analysis.visualStyle}
    - Color Grade: ${analysis.colorGrade}

    MANDATORY CONSISTENCY RULES:
    1. Define a specific PERSONA for the protagonist (e.g., "Mike, 30s, bearded dad") at the start.
    2. In every 'visual' field where the person appears, refer to them by this persona description to ensure image generation consistency.
    3. AUDIO GENDER ALIGNMENT: 
       - If the persona is Male, 'style' MUST start with "Male".
       - If the persona is Female, 'style' MUST start with "Female".

    For each variant:
    1. Create a "soraPrompt" for video generation (Sora-2 style), incorporating the visual style and color grade.
    2. Create a script breakdown with ${sceneCount} scenes.
    3. FILL IN DIRECTOR DETAILS: shotType, movement, lighting for each scene.
    4. Include translations for Chinese (Simplified).
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        ...imageParts,
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      maxOutputTokens: 8192,
    }
  });

  if (!response.text) {
    throw new Error("No script generated");
  }

  return JSON.parse(response.text) as ScriptVariant[];
}

// --- Scene Visual Generation ---

export async function generateSceneImage(visualDesc: string, refImageBase64: string | null): Promise<string> {
  const parts: any[] = [{ text: `Generate a photorealistic vertical (9:16) scene. Description: ${visualDesc}` }];
  
  if (refImageBase64) {
    parts.unshift({
      inlineData: {
        data: refImageBase64,
        mimeType: 'image/jpeg'
      }
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    config: {
      imageConfig: { aspectRatio: "9:16" }
    }
  });

   for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return part.inlineData.data;
    }
  }
  throw new Error("No image generated");
}

// --- Regenerate Row ---

export async function regenerateScriptRow(row: ScriptRow, context: string, language: Language): Promise<ScriptRow> {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      timeframe: { type: Type.STRING },
      visual: { type: Type.STRING },
      visualTranslation: { type: Type.STRING },
      shotType: { type: Type.STRING },
      movement: { type: Type.STRING },
      lighting: { type: Type.STRING },
      audio: { type: Type.STRING },
      audioTranslation: { type: Type.STRING },
      style: { type: Type.STRING },
    },
    required: ["id", "timeframe", "visual", "visualTranslation", "shotType", "movement", "lighting", "audio", "audioTranslation", "style"]
  };

  const prompt = `
    Regenerate this script row to be more engaging.
    Context: ${context}
    Language: ${language}
    Current Row: ${JSON.stringify(row)}
    
    IMPORTANT: Maintain the same Character Persona and Gender from the context.
    If the context implies a Male speaker, keep the audio style Male.
    If the context implies a Female speaker, keep the audio style Female.
    Provide detailed director notes (shotType, movement, lighting).
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });

  if (!response.text) throw new Error("No response");
  return JSON.parse(response.text) as ScriptRow;
}

// --- Client Side Utilities ---

export async function captureVideoFrames(videoFile: File, targets: { start: number }[]): Promise<string[]> {
  const video = document.createElement('video');
  video.src = URL.createObjectURL(videoFile);
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = "anonymous";
  
  await new Promise((resolve) => {
    video.onloadedmetadata = () => resolve(true);
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  const frames: string[] = [];

  for (const target of targets) {
    video.currentTime = target.start;
    await new Promise(r => video.onseeked = r);
    
    // Set low resolution for preview
    canvas.width = 320; 
    canvas.height = (320 * video.videoHeight) / video.videoWidth;
    
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    frames.push(canvas.toDataURL('image/jpeg', 0.7));
  }
  
  URL.revokeObjectURL(video.src);
  video.remove();
  canvas.remove();
  
  return frames;
}

export async function composeNineGridImage(visuals: string[]): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("No canvas context");

    // 9:16 Vertical Canvas (1080x1920) for the final storyboard
    const totalWidth = 1080;
    const totalHeight = 1920;
    
    canvas.width = totalWidth;
    canvas.height = totalHeight;

    const cols = 3;
    const rows = 3;
    // Calculate cell size based on 9:16 total
    const cellWidth = totalWidth / cols; // 360px
    const cellHeight = totalHeight / rows; // 640px
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const images = await Promise.all(visuals.slice(0, 9).map(src => {
        return new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = `data:image/jpeg;base64,${src}`;
        });
    }));

    images.forEach((img, i) => {
        const x = (i % cols) * cellWidth;
        const y = Math.floor(i / cols) * cellHeight;
        
        // Scale to cover the cell
        const scale = Math.max(cellWidth / img.width, cellHeight / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const offsetX = (cellWidth - w) / 2;
        const offsetY = (cellHeight - h) / 2;
        
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, cellWidth, cellHeight);
        ctx.clip();
        ctx.drawImage(img, x + offsetX, y + offsetY, w, h);
        ctx.restore();
        
        // Add number overlay
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(x + 5, y + 5, 30, 30);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((i + 1).toString(), x + 20, y + 20);
    });

    return canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
}