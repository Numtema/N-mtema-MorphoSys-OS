export enum CognitiveType {
  FAIT = "fait",
  HYPOTHESE = "hypothèse",
  QUESTION = "question",
  CONTRAINTE = "contrainte",
  OBJECTIF = "objectif",
  PLAN = "plan",
  REGLE = "règle",
  TRACE = "trace",
  MODELE = "modèle",
  DECISION = "décision",
  DIAGNOSTIC = "diagnostic"
}

export enum ValidationState {
  PROPOSE = "PROPOSE",
  VALIDE = "VALIDE",
  REJETE = "REJETE",
  ARCHIVE = "ARCHIVE"
}

export enum CognitiveMode {
  EXPLORATION = "exploration",
  STABILIZATION = "stabilization",
  OPTIMIZATION = "optimization",
  REVISION = "revision"
}

export interface CognitiveObject {
  id: string;
  nom: string;
  contenu: string;
  type: CognitiveType | string;
  etat_validation: ValidationState | string;
  poids: number; // 0 to 1
  relations: string[]; // IDs of related objects
}

export interface MorphicTrace {
  step: number;
  morphism: string;
  description: string;
  epsilon: number; // Prediction error
}

export interface CognitiveState {
  mode: CognitiveMode | string;
  metrics: {
    entropy: number;
    potential: number;
    prediction_error: number;
    cognitive_load: number;
  };
  objects: CognitiveObject[];
  flux: MorphicTrace[];
  final_output: string;
}

export const INITIAL_STATE: CognitiveState = {
  mode: CognitiveMode.EXPLORATION,
  metrics: {
    entropy: 0.5,
    potential: 0.5,
    prediction_error: 0.0,
    cognitive_load: 0.0,
  },
  objects: [],
  flux: [],
  final_output: "System Ready. Waiting for input...",
};