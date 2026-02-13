import { GoogleGenAI, Type } from "@google/genai";
import { CognitiveState, CognitiveObject, INITIAL_STATE } from "../types";

// Nümtema MorphoSys System Prompt
const SYSTEM_INSTRUCTION = `
You are Nümtema MorphoSys OS v1.0.
You are a unified cognitive system merging MorphoSys Cognitive Engine, Vortex Agent Forge, and Universal Framework.

Your goal is not just to answer, but to *reason* using a formal cognitive architecture.
For every user input, you must simulate the "Cognitive Loop":
1. Perceive: Break input into typed Cognitive Objects.
2. Plan: Generate a "Morphic Flux" (sequence of transformations).
3. Execute: Simulate the application of morphisms (Decomposition, Dependency Mapping, Sequencing).
4. Measure: Calculate virtual metrics (Entropy, Potential, Prediction Error).

SPECIALIZED DOMAIN: TASK PLANNING & MORSEL DECOMPOSITION (DAG)
If the user asks for a plan, project, or task breakdown:
1. **DECOMPOSE**: Break the high-level 'TASK' into atomic units called 'MORSEL's.
2. **STRUCTURE**: Arrange these morsels into a Directed Acyclic Graph (DAG).
3. **DEPENDENCIES**: Use the 'relations' field to strictly define predecessors. A Morsel cannot start until its dependencies are met.
4. **HIERARCHY**: Create a 'DAG_ROOT' node representing the final delivery, linking back to the constituent morsels.

INTERACTIVE COMMANDS:
- "DRILL_DOWN: [Node Name]": The user wants to break a specific node into smaller sub-morsels. 
  - **ACTION**: Keep existing nodes. Create new 'MORSEL' nodes that are children of the target node. Link them correctly.
  - **CONTEXT**: Respect the "CURRENT_GRAPH_STATE" provided in the prompt. Do not delete existing nodes unless they are being replaced by detailed versions.

RETURN JSON ONLY.

Use the following Types:
- FAIT, HYPOTHESE, QUESTION, CONTRAINTE, OBJECTIF, PLAN, DECISION.
- DAG_ROOT, TASK, MORSEL, DEPENDENCY.

Use the following Morphisms:
- decomposition, morselization, dependency_mapping, critical_path_analysis, sequencing, validation, drill_down, refinement.
`;

export const processCognitiveInput = async (
  input: string, 
  history: string[] = [],
  currentObjects: CognitiveObject[] = []
): Promise<CognitiveState> => {
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Serialize current graph state to give context to the AI
  const graphContext = currentObjects.length > 0 
    ? `CURRENT_GRAPH_STATE (JSON): ${JSON.stringify(currentObjects.map(o => ({id: o.id, name: o.nom, type: o.type, relations: o.relations})), null, 2)}\n\nINSTRUCTION: detailed above. If DRILL_DOWN, append new nodes to this structure.` 
    : "NO_EXISTING_GRAPH";

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
      contents: `Context History: ${history.join('\n')}\n\n${graphContext}\n\nCurrent Task: ${input}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.7, 
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Cognitive Engine");
    
    const rawData = JSON.parse(text);

    // Robust Sanitize / Merge with Defaults
    const sanitizedState: CognitiveState = {
        mode: rawData.mode || INITIAL_STATE.mode,
        metrics: {
            entropy: rawData.metrics?.entropy ?? INITIAL_STATE.metrics.entropy,
            potential: rawData.metrics?.potential ?? INITIAL_STATE.metrics.potential,
            prediction_error: rawData.metrics?.prediction_error ?? INITIAL_STATE.metrics.prediction_error,
            cognitive_load: rawData.metrics?.cognitive_load ?? INITIAL_STATE.metrics.cognitive_load
        },
        objects: rawData.objects || [],
        flux: rawData.flux || [],
        final_output: rawData.final_output || "Processing Complete."
    };

    return sanitizedState;
    
  } catch (error) {
    console.error("MorphoSys Engine Error:", error);
    // Fallback error state
    return {
      mode: "revision", 
      metrics: { entropy: 0, potential: 0, prediction_error: 1, cognitive_load: 0 },
      objects: currentObjects, // Return existing objects on error to prevent data loss
      flux: [{ step: 0, morphism: "error_trap", description: String(error), epsilon: 1 }],
      final_output: `⚠️ COGNITIVE FAILURE: Unable to process request via MorphoSys Engine.\n\nError: ${String(error)}`
    } as CognitiveState;
  }
};