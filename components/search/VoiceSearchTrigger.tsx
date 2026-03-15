"use client";

import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import VoiceSearchOverlay from "@/components/search/VoiceSearchOverlay";

interface VoiceSearchTriggerProps {
  onOpen: () => void;
}

export default function VoiceSearchTrigger({ onOpen }: VoiceSearchTriggerProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onOpen}
      className="h-7 w-7 min-w-[28px] p-0 text-orange-500 hover:text-orange-600 hover:bg-orange-50 transition-all active:scale-90"
      title="Voice Search"
    >
      <Mic className="h-4 w-4" />
    </Button>
  );
}
