# Nümtema MorphoSys OS

A Unified Cognitive OS merging MorphoSys Engine, Vortex, and Universal Framework powered by Gemini.

## Features

- **Cognitive Visualizer**: Real-time D3.js force-directed graph of cognitive objects.
- **Morphic Flux Log**: Traceable logs of the AI's reasoning steps and morphisms.
- **Metrics Dashboard**: Monitoring of virtual entropy, potential, and prediction error.
- **Gemini 3 Flash Integration**: Powered by Google's latest high-performance model.

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure API Key**
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

## Architecture

- **React 19**: Frontend framework.
- **Vite**: Build tool.
- **@google/genai**: AI interaction.
- **D3.js**: Data visualization.
- **Tailwind CSS**: Styling.
