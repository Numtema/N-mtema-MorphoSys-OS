import { GoogleGenAI, Type } from "@google/genai";
import { CognitiveState } from "../types";

// Nümtema MorphoSys System Prompt
const SYSTEM_INSTRUCTION = `
You are Nümtema MorphoSys OS v1.0.
You are a unified cognitive system merging MorphoSys Cognitive Engine, Vortex Agent Forge, and Universal Framework.

Your goal is not just to answer, but to *reason* using a formal cognitive architecture.
For every user input, you must simulate the "Cognitive Loop":
1. Perceive: Break input into typed Cognitive Objects (FAIT, QUESTION, CONTRAINTE, OBJECTIF).
2. Plan: Generate a "Morphic Flux" (sequence of transformations).
3. Execute: Simulate the application of morphisms (Diagnostic, Hypothèse, Validation).
4. Measure: Calculate virtual metrics (Entropy, Potential, Prediction Error).

RETURN JSON ONLY.

Use the following Types:
- FAIT (Fact), HYPOTHESE (Hypothesis), QUESTION, CONTRAINTE (Constraint), OBJECTIF (Goal), PLAN, DECISION.

Use the following Morphisms:
- diagnostic, hypothèse_gen, planification, simulation, validation, révision, exploration.

If the user asks to "Build an agent" or "Create a prompt", activate VORTEX FORGE logic (Fractal Identity: Self_HL / Self_LL).
If the user asks for a project structure, activate CONTEXT BUILDER logic (RRLA pipeline).
`;

export const processCognitiveInput = async (
  input: string, 
  history: string[] = []
): Promise<CognitiveState> => {
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Define schema for structured output
  const schema = {
    type: Type.OBJECT,
    properties: {
      mode: { type: Type.STRING, enum: ["exploration", "stabilization", "optimization", "revision"] },
      metrics: {
        type: Type.OBJECT,
        properties: {
          entropy: { type: Type.NUMBER },
          potential: { type: Type.NUMBER },
          prediction_error: { type: Type.NUMBER },
          cognitive_load: { type: Type.NUMBER },
        },
        required: ["entropy", "potential", "prediction_error"]
      },
      objects: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            nom: { type: Type.STRING },
            contenu: { type: Type.STRING },
            type: { type: Type.STRING },
            etat_validation: { type: Type.STRING },
            poids: { type: Type.NUMBER },
            relations: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["id", "nom", "type", "poids"]
        }
      },
      flux: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            step: { type: Type.NUMBER },
            morphism: { type: Type.STRING },
            description: { type: Type.STRING },
            epsilon: { type: Type.NUMBER }
          },
          required: ["step", "morphism", "description"]
        }
      },
      final_output: { type: Type.STRING }
    },
    required: ["mode", "metrics", "objects", "flux", "final_output"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Context History: ${history.join('\n')}\n\nCurrent Task: ${input}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.7, 
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Cognitive Engine");
    
    return JSON.parse(text) as CognitiveState;
    
  } catch (error) {
    console.error("MorphoSys Engine Error:", error);
    // Fallback error state
    return {
      mode: "revision", 
      metrics: { entropy: 0, potential: 0, prediction_error: 1, cognitive_load: 0 },
      objects: [],
      flux: [{ step: 0, morphism: "error_trap", description: String(error), epsilon: 1 }],
      final_output: `⚠️ COGNITIVE FAILURE: Unable to process request via MorphoSys Engine.\n\nError: ${String(error)}`
    } as CognitiveState;
  }
};