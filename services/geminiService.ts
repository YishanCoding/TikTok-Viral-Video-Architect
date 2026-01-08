import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Language, Duration, ScriptRow, GeneratedContent, ScriptVariant, VideoScene, VideoAnalysisResult } from "../types";

// --- Helper: Retry with Exponential Backoff ---
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = 5,
  delay: number = 1000,
  factor: number = 2
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    // Check for 503 Service Unavailable or "overloaded" messages
    // robust check for different error structures
    const isOverloaded = 
      error?.status === 503 || 
      error?.code === 503 || 
      error?.error?.code === 503 ||
      error?.error?.status === "UNAVAILABLE" ||
      (error?.message && (error.message.includes('overloaded') || error.message.includes('UNAVAILABLE'))) ||
      (JSON.stringify(error).includes('503') || JSON.stringify(error).includes('overloaded'));
      
    if (retries > 0 && isOverloaded) {
      console.warn(`Model overloaded. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * factor, factor);
    }
    throw error;
  }
}

// --- Helper: Convert File to Base64 (Gemini Part) ---
export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { mimeType: string; data: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          mimeType: file.type,
          data: base64Data
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// --- Helper: Capture Video Frames ---
export const captureVideoFrames = async (videoFile: File, timestamps: { start: number }[]): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(videoFile);
    video.muted = true;
    video.playsInline = true;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const screenshots: string[] = [];
    let currentIndex = 0;

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth / 2; // Reduce resolution for performance
      canvas.height = video.videoHeight / 2;
      
      const captureNext = () => {
        if (currentIndex >= timestamps.length) {
          URL.revokeObjectURL(video.src);
          resolve(screenshots);
          return;
        }

        video.currentTime = timestamps[currentIndex].start;
      };

      video.onseeked = () => {
        if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            screenshots.push(canvas.toDataURL('image/jpeg', 0.7)); // Compress
        }
        currentIndex++;
        captureNext();
      };

      captureNext(); // Start loop
    };

    video.onerror = () => {
      reject(new Error("Failed to load video for frame capture"));
    };
  });
};

// --- Helper: Compose 9-Grid Image (Canvas) ---
export const composeNineGridImage = async (base64Images: string[]): Promise<string> => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        // Target: 9:16 Aspect Ratio (e.g., 1080x1920)
        const totalWidth = 1080;
        const totalHeight = 1920;
        canvas.width = totalWidth;
        canvas.height = totalHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
        }

        // Fill background
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, totalWidth, totalHeight);

        // Grid: 3 columns, 3 rows
        // Cell size: 1080 / 3 = 360px width
        // Cell height: 1920 / 3 = 640px height (matches 9:16 aspect ratio exactly for each cell!)
        const cellW = totalWidth / 3;
        const cellH = totalHeight / 3;

        let loadedCount = 0;
        const imagesToLoad = base64Images.slice(0, 9); // Take first 9
        
        if (imagesToLoad.length === 0) {
            resolve("");
            return;
        }

        imagesToLoad.forEach((src, idx) => {
            const img = new Image();
            img.onload = () => {
                const col = idx % 3;
                const row = Math.floor(idx / 3);
                const x = col * cellW;
                const y = row * cellH;
                
                // Draw image covering the cell
                // Calculate aspect ratio to cover
                const scale = Math.max(cellW / img.width, cellH / img.height);
                const w = img.width * scale;
                const h = img.height * scale;
                const offsetX = x + (cellW - w) / 2;
                const offsetY = y + (cellH - h) / 2;

                ctx.save();
                ctx.beginPath();
                ctx.rect(x, y, cellW, cellH);
                ctx.clip();
                ctx.drawImage(img, offsetX, offsetY, w, h);
                ctx.restore();

                loadedCount++;
                if (loadedCount === imagesToLoad.length) {
                    const finalBase64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
                    resolve(finalBase64);
                }
            };
            img.onerror = (e) => {
                console.error("Failed to load image for grid", e);
                // Continue despite error
                loadedCount++;
                if (loadedCount === imagesToLoad.length) {
                     const finalBase64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
                     resolve(finalBase64);
                }
            };
            img.src = `data:image/jpeg;base64,${src}`;
        });
    });
};

// --- API: Generate White Background Product Grid (Step 1) ---
export const generateProductGrid = async (imageParts: any[], description: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
      Create a "9-grid reference sheet" (3x3 grid layout) for this product on a pure WHITE BACKGROUND.
      The product is described as: "${description}".
      The grid should contain 9 distinct panels showing:
      - Front view
      - Back view
      - Side profiles
      - Top/down view
      - Close-ups of material textures
      - Detail shots of features
      Style: Professional E-commerce Product Photography, Studio Lighting, Clean, High Resolution. 
      No text overlays, No props, just the product.
    `;

    const response = await retryWithBackoff(() => ai.models.generateContent({
      model: 'gemini-3-pro-image-preview', // High quality for reference
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
    }));

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    throw new Error("No image generated by the model.");
  } catch (error) {
    console.error("Error generating product grid:", error);
    throw error;
  }
};

// --- API: Analyze Video Content ---
export const analyzeVideoContent = async (videoFile: File): Promise<Omit<VideoAnalysisResult, 'scenes'> & { scenes: any[] }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const videoPart = await fileToGenerativePart(videoFile);

    const prompt = `
      Analyze this TikTok video in detail. Focus on both VISUALS and AUDIO.
      
      CRITICAL INSTRUCTION: You MUST LISTEN to the audio track and provide a word-for-word transcript.
      Also extract key product features or selling points mentioned or shown.
      
      Break it down into scenes/shots. For each scene, provide:
      1. start_time (seconds, float)
      2. end_time (seconds, float)
      3. category (Choose from: 'Product Info', 'Usage', 'Benefits', 'Hook', 'CTA', 'Other')
      4. description (Visual description)
      5. transcript_original (Exact spoken words in original language. If silence/music, say "[Music]")
      6. transcript_translation (Translate spoken words to Simplified Chinese)

      Also provide a list of "extracted_features" found in the video. For each feature, provide the English text and a Simplified Chinese translation.

      Return strictly JSON.
    `;

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        scenes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              start_time: { type: Type.NUMBER },
              end_time: { type: Type.NUMBER },
              category: { type: Type.STRING, enum: ['Product Info', 'Usage', 'Benefits', 'Hook', 'CTA', 'Other'] },
              description: { type: Type.STRING },
              transcript_original: { type: Type.STRING },
              transcript_translation: { type: Type.STRING },
            },
            required: ["start_time", "end_time", "category", "description", "transcript_original", "transcript_translation"]
          }
        },
        extracted_features: {
            type: Type.ARRAY,
            items: { 
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING },
                    translation: { type: Type.STRING }
                },
                required: ["text", "translation"]
            },
            description: "List of key selling points or features identified in the video with translations"
        }
      },
      required: ["scenes", "extracted_features"]
    };

    const response = await retryWithBackoff(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [videoPart, { text: prompt }] },
      config: {
        systemInstruction: "You are a video analysis expert capable of hearing audio and seeing visuals.",
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    }));

    const data = JSON.parse(response.text || "{}");
    
    // Format times to "MM:SS" string for UI
    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = Math.floor(s % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formattedScenes = data.scenes.map((s: any) => ({
      startTime: formatTime(s.start_time),
      endTime: formatTime(s.end_time),
      category: s.category,
      description: s.description,
      transcriptOriginal: s.transcript_original,
      transcriptTranslation: s.transcript_translation,
      rawStartTime: s.start_time // Keep raw for seeking
    }));

    return {
        scenes: formattedScenes,
        features: data.extracted_features || []
    };

  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

// --- API: Generate Single Scene Image ---
export const generateSceneImage = async (visualDescription: string, referenceImageBase64: string | null): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const parts: any[] = [];
    if (referenceImageBase64) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: referenceImageBase64
        }
      });
    }

    const prompt = `
      Generate a single photorealistic 9:16 vertical TikTok video frame.
      
      Scene Description: ${visualDescription}
      
      IMPORTANT STYLE CONSTRAINTS (Strict Adherence):
      1. Composition: FULL FRAME, IMMERSIVE. The image must fill the entire 9:16 canvas. DO NOT generate white borders, letterboxing, or floating objects in empty space.
      2. Setting: Real, lived-in American home (e.g., slightly messy bathroom counter, cluttered kitchen table, bedroom with clothes). NOT a studio.
      3. Camera: Handheld iPhone aesthetic. Slightly grainy, imperfect lighting, maybe a bit blurry or motion blur to suggest movement.
      4. Vibe: Amateur UGC (User Generated Content), authentic, relatable. NOT commercial/ad-like.
      
      PRODUCT INTEGRATION:
      If the scene description mentions the product, it must look exactly like the reference image provided, but integrated naturally into the environment.
    `;

    parts.push({ text: prompt });

    const response = await retryWithBackoff(() => ai.models.generateContent({
        model: 'gemini-2.5-flash-image', // Nano Banana
        contents: { parts: parts },
        config: {}
    }));

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }
    throw new Error("No image generated");
};

// --- API: Regenerate Single Script Row ---
export const regenerateScriptRow = async (
    originalRow: ScriptRow, 
    context: string, 
    language: string
): Promise<ScriptRow> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
        Regenerate this specific script row to be more engaging for a US TikTok audience.
        Context of video: ${context}
        
        Current Row:
        Time: ${originalRow.timeframe}
        Visual: ${originalRow.visual}
        Audio: ${originalRow.audio}
        
        Task: 
        1. Rewrite the Visual and Audio (in ${language}).
        2. Provide Simplified Chinese translations for both.
        3. Visuals must be "show, don't tell". If audio describes a problem, visual shows the problem, not the product.
    `;

    const responseSchema: Schema = {
         type: Type.OBJECT,
         properties: {
             visual: { type: Type.STRING },
             visual_translation: { type: Type.STRING },
             audio: { type: Type.STRING },
             audio_translation: { type: Type.STRING },
             style: { type: Type.STRING }
         }
    };

    const response = await retryWithBackoff(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ text: prompt }] },
        config: { responseMimeType: "application/json", responseSchema }
    }));

    const data = JSON.parse(response.text || "{}");
    return {
        ...originalRow,
        visual: data.visual,
        visualTranslation: data.visual_translation,
        audio: data.audio,
        audioTranslation: data.audio_translation,
        style: data.style
    };
};

/**
 * Step 2: Generate the Script and Sora Prompt
 */
export const generateScriptAndPrompt = async (
  imageParts: any[],
  analysisData: VideoAnalysisResult | null,
  selectedFeatures: string[],
  description: string, 
  language: Language, 
  duration: Duration,
  count: number = 1
): Promise<ScriptVariant[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const durationSec = duration === Duration.SHORT ? 15 : 25;
    
    let analysisContext = "";
    if (analysisData) {
        analysisContext = `
        REFERENCE VIDEO ANALYSIS (Use this pacing and structure):
        ${analysisData.scenes.map(s => `[${s.startTime}-${s.endTime}] (${s.category}):
           Visual: ${s.description}
           Audio: ${s.transcriptOriginal}
        `).join('\n')}
        
        KEY SELLING POINTS TO INTEGRATE (User Selected):
        ${selectedFeatures.map((f, i) => `${i+1}. ${f}`).join('\n')}
        `;
    }

    const systemInstruction = `
      You are a world-class TikTok E-commerce Short Video Expert targeting the US Market.
      Your goal is to create ${count} DISTINCT high-converting UGC video scripts.
      
      CRITICAL STYLE GUIDELINES (US UGC):
      1. Setting: Authentic US homes (messy, lived-in).
      2. Vibe: Handheld, amateur, relatable.
      3. Visual Strategy: STRICT AUDIO-VISUAL ALIGNMENT.
      4. INTEGRATION: You MUST naturally weave the "User Selected Selling Points" into the script, adapting the reference video's structure to fit this specific product.
      
      CONSTRAINTS:
      1. Language: STRICTLY output the script audio in ${language}.
      2. Duration: Each script must fit exactly into ${durationSec} seconds.
      3. Translations: Provide Simplified Chinese translations.
    `;

    let userPrompt = `
      Product Description: ${description}
      ${analysisContext}
      
      Task 1: Create ${count} different TikTok Scripts.
      Task 2: Create a corresponding Sora-2 Prompt for each script.
    `;

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        variants: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              script: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    timeframe: { type: Type.STRING },
                    visual: { type: Type.STRING, description: "Description of the scene in English" },
                    visual_translation: { type: Type.STRING, description: "Simplified Chinese translation of visual" },
                    audio: { type: Type.STRING, description: "Spoken audio in target language" },
                    audio_translation: { type: Type.STRING, description: "Simplified Chinese translation of audio" },
                    style: { type: Type.STRING }
                  },
                  required: ["timeframe", "visual", "visual_translation", "audio", "audio_translation", "style"]
                }
              },
              soraPrompt: { type: Type.STRING, description: "English prompt" },
              sora_prompt_translation: { type: Type.STRING, description: "Simplified Chinese translation of prompt" }
            },
            required: ["name", "script", "soraPrompt", "sora_prompt_translation"]
          }
        }
      },
      required: ["variants"]
    };

    const parts = [...imageParts, { text: userPrompt }];

    const response = await retryWithBackoff(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema
      }
    }));

    const jsonText = response.text;
    const parsed = JSON.parse(jsonText);
    
    return parsed.variants.map((v: any) => ({
      id: crypto.randomUUID(),
      name: v.name,
      soraPrompt: v.soraPrompt,
      soraPromptTranslation: v.sora_prompt_translation,
      script: v.script.map((s: any) => ({
        id: crypto.randomUUID(),
        timeframe: s.timeframe,
        visual: s.visual,
        visualTranslation: s.visual_translation,
        audio: s.audio,
        audioTranslation: s.audio_translation,
        style: s.style
      }))
    }));

  } catch (error) {
    console.error("Error generating scripts:", error);
    throw error;
  }
};
