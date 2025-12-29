"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface OllamaModel {
  name: string;
  size?: number;
  modified_at?: string;
  digest?: string;
}

interface ModelSelectionState {
  selectedModel: string | null;
  availableModels: OllamaModel[];
  isLoading: boolean;
  error: string | null;
  hasHydrated: boolean;
  setSelectedModel: (model: string) => void;
  loadModels: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasHydrated: (hydrated: boolean) => void;
}

export const useModelSelection = create<ModelSelectionState>()(
  persist(
    (set, get) => ({
      selectedModel: null,
      availableModels: [],
      isLoading: false,
      error: null,
      hasHydrated: false,

      setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),

      setSelectedModel: (model) => {
        console.log(`Setting selected model to: ${model}`);
        set({ selectedModel: model, error: null });
      },

      loadModels: async () => {
        console.log("[useModelSelection] Loading models...");
        set({ isLoading: true, error: null });
        try {
          const response = await fetch("/api/ollama/models", {
            method: "GET",
            credentials: "include",
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(
              "[useModelSelection] Failed to load models. Status:",
              response.status,
              errorData,
            );
            set({
              error: "Failed to load Ollama models",
              isLoading: false,
            });
            return;
          }

          const data = await response.json();
          const models = data.models || [];
          console.log(`[useModelSelection] Loaded ${models.length} models:`, models.map((m: OllamaModel) => m.name));

          set({ availableModels: models });

          const currentSelection = get().selectedModel;
          console.log(`[useModelSelection] Current selection: ${currentSelection}`);

          if (!currentSelection && models.length > 0) {
            const firstModel = models[0].name;
            console.log(
              `[useModelSelection] No model selected, auto-selecting first model: ${firstModel}`,
            );
            set({ selectedModel: firstModel });
          } else if (
            currentSelection &&
            !models.find((m: OllamaModel) => m.name === currentSelection)
          ) {
            console.warn(
              `[useModelSelection] Previously selected model "${currentSelection}" not found in available models`,
            );
            if (models.length > 0) {
              const firstModel = models[0].name;
              console.log(`[useModelSelection] Falling back to first model: ${firstModel}`);
              set({ selectedModel: firstModel });
            }
          } else if (currentSelection) {
            console.log(`[useModelSelection] Using existing selection: ${currentSelection}`);
          }
        } catch (error) {
          console.error("[useModelSelection] Error loading models:", error);
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to connect to Ollama",
          });
        } finally {
          set({ isLoading: false });
        }
      },

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),
    }),
    {
      name: "model-selection-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedModel: state.selectedModel,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
