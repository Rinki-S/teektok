"use client";

import { ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

interface ShortsNavigatorProps {
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
}

export function ShortsNavigator({
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
}: ShortsNavigatorProps) {
  return (
    <ButtonGroup
      orientation="vertical"
      aria-label="Media controls"
      className="h-fit hidden md:flex"
    >
      <Button
        variant="secondary"
        size="icon"
        onClick={onPrevious}
        disabled={!canGoPrevious}
      >
        <ChevronUp />
      </Button>
      <Button
        variant="secondary"
        size="icon"
        onClick={onNext}
        disabled={!canGoNext}
      >
        <ChevronDown />
      </Button>
    </ButtonGroup>
  );
}
