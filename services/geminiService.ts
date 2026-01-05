import { GoogleGenAI, Type } from "@google/genai";
import { AgentRole, DesignConstraints, DesignResult, DebateMessage, DesignSolution } from "../types";

export const runDesignDebate = async (
  prompt: string,
  imageInput: string | null,
  constraints: DesignConstraints
): Promise<DesignResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = `
    You are simulating an elite collaborative product design workshop between 5 specialist agents with specific roles. All communication MUST be in English.
    
    1. Chief Product Officer (CPO) - Final decision maker, controls product and business direction. Focus: Business value, brand consistency, feasibility. Influence: High (Level 3).
    2. Senior Industrial Designer (DESIGN) - Responsible for aesthetics, form, and CMF. Focus: Visual language, ergonomics, aesthetic trends. Influence: Medium (Level 2).
    3. Technical Director (TECH) - Evaluates technical implementation and cost. Focus: Structural feasibility, cost control, production processes. Influence: Medium (Level 2).
    4. UX Researcher (UX) - Simulates user perspective, provides critical feedback. Focus: User pain points, usability, emotional connection. Influence: Low (Level 3).
    5. Market Researcher (MARKET) - Competitor analysis and trend forecasting. Focus: Differentiation, market entry, trending colors/elements. Influence: Low (Level 3).

    The debate MUST feature multiple rounds in English:
    - Round 1: Each agent provides initial reactions based on their specific focus points.
    - Round 2: Agents challenge each other (e.g., TECH questions DESIGN's form, MARKET questions CPO's direction).
    - Round 3: CPO synthesizes the discussion into two clear strategic design solutions.

    Constraints:
    - Purpose: ${constraints.purpose}
    - Brand Tone: ${constraints.brandTone}
    - Target Audience: ${constraints.targetAudience}
    - Price Point: ${constraints.pricePoint}

    Output JSON structure (All text fields must be in English):
    {
      "debateHistory": [ { "role": "Full Agent Role Name", "content": "..." }, ... ],
      "solutions": [
        {
          "title": "Solution Name",
          "consensusSummary": "Refined design details...",
          "highlights": ["Word1", "Word2", "Word3"],
          "evaluation": { "technicalFeasibility": 0-100, "marketCompetitiveness": 0-100, "aesthetics": 0-100, "usability": 0-100, "innovation": 0-100 },
          "refinedVisualPrompt": "Detailed prompt for industrial design image generation"
        },
        ... (Exactly 2 solutions)
      ]
    }
  `;

  const parts: any[] = [{ text: `User Idea: ${prompt}\nConduct the design meeting in English and provide the synthesized solutions in JSON.` }];
  
  if (imageInput) {
    const mimeType = imageInput.match(/data:(.*?);/)?.[1] || 'image/png';
    const base64Data = imageInput.split(',')[1];
    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: base64Data
      }
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: { parts },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          debateHistory: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                role: { type: Type.STRING },
                content: { type: Type.STRING }
              },
              required: ["role", "content"]
            }
          },
          solutions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                consensusSummary: { type: Type.STRING },
                highlights: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  minItems: 3, maxItems: 3 
                },
                evaluation: {
                  type: Type.OBJECT,
                  properties: {
                    technicalFeasibility: { type: Type.NUMBER },
                    marketCompetitiveness: { type: Type.NUMBER },
                    aesthetics: { type: Type.NUMBER },
                    usability: { type: Type.NUMBER },
                    innovation: { type: Type.NUMBER }
                  },
                  required: ["technicalFeasibility", "marketCompetitiveness", "aesthetics", "usability", "innovation"]
                },
                refinedVisualPrompt: { type: Type.STRING }
              },
              required: ["title", "consensusSummary", "evaluation", "refinedVisualPrompt", "highlights"]
            },
            minItems: 2, maxItems: 2
          }
        },
        required: ["debateHistory", "solutions"]
      }
    }
  });

  const parsedData = JSON.parse(response.text || '{}');
  const solutions: DesignSolution[] = [];

  for (const solData of parsedData.solutions) {
    const imageResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `Professional industrial design studio photography: ${solData.refinedVisualPrompt}. High-end, minimal, ${constraints.brandTone} aesthetic, studio lighting, clear background, 8k.` }]
      },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });

    let imageUrl = '';
    for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    solutions.push({
      imageUrl,
      title: solData.title,
      consensusSummary: solData.consensusSummary,
      evaluation: solData.evaluation,
      highlights: solData.highlights
    });
  }

  return {
    solutions,
    debateHistory: parsedData.debateHistory
  };
};