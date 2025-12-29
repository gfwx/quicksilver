"use client";

import { useEffect } from "react";
import { useModelSelection } from "@/lib/hooks/useModelSelection";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";
import { Button } from "@/lib/components/ui/button";
import { ChevronDown, Bot, AlertCircle } from "lucide-react";

export default function ModelSelector() {
  const {
    selectedModel,
    availableModels,
    isLoading,
    error,
    setSelectedModel,
    loadModels,
  } = useModelSelection();

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  const handleModelChange = (modelName: string) => {
    setSelectedModel(modelName);
    console.log(`Model changed to: ${modelName}`);
  };

  if (error) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400">
        <AlertCircle className="size-4" />
        <span>{error}</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
        <Bot className="size-4 animate-pulse" />
        <span>Loading models...</span>
      </div>
    );
  }

  if (availableModels.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
        <AlertCircle className="size-4" />
        <span>No models available</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center mb-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full max-w-xs flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <Bot className="size-4" />
              <span className="truncate">
                {selectedModel || "Select Model"}
              </span>
            </div>
            <ChevronDown className="size-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto">
          <DropdownMenuLabel>Available Models</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={selectedModel || ""}
            onValueChange={handleModelChange}
          >
            {availableModels.map((model) => (
              <DropdownMenuRadioItem key={model.name} value={model.name}>
                <div className="flex flex-col">
                  <span className="font-medium">{model.name}</span>
                  {model.size && (
                    <span className="text-xs text-muted-foreground">
                      {(model.size / 1024 / 1024 / 1024).toFixed(2)} GB
                    </span>
                  )}
                </div>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
