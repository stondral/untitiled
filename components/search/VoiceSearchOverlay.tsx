"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, Loader2, Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPortal } from "react-dom";

interface VoiceSearchOverlayProps {
  onClose: () => void;
}

export default function VoiceSearchOverlay({ onClose }: VoiceSearchOverlayProps) {
  const router = useRouter();
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Ready to search");
  const [mounted, setMounted] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isManualInput, setIsManualInput] = useState(false);
  const recognitionRef = useRef<any>(null);

  const addLog = useCallback((message: string) => {
    console.log(`[VoiceSearch] ${message}`);
    setLogs(prev => [...prev.slice(-4), message]); // Keep last 5 logs
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const stopListening = useCallback(() => {
    addLog("Stop requested");
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        addLog("Recognition stopped");
      } catch (e) {
        addLog(`Error stopping: ${e}`);
      }
      setIsListening(false);
      setStatus("IDLE");
    }
  }, [addLog]);

  const startListening = useCallback(async () => {
    addLog("Start initiated");
    setError(null);
    setStatus("BUSY");
    
    // Detect Brave
    const isBrave = (navigator as any).brave !== undefined && await (navigator as any).brave.isBrave();
    if (isBrave) {
      addLog("Brave Detected");
    }

    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      addLog("Speech API MISSING");
      setError("Speech recognition is not supported in this browser.");
      setStatus("NOT_SUPPORTED");
      return;
    }

    if (recognitionRef.current) {
      addLog("Cleaning up old instance...");
      try { 
        const old = recognitionRef.current;
        old.onstart = null;
        old.onend = null;
        old.onerror = null;
        old.onresult = null;
        old.stop(); 
      } catch (e) {}
      recognitionRef.current = null;
    }

    addLog("Instantiating Engine V5...");
    setStatus("STARTING");
    
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();

    // Use single-shot for better compatibility if continuous hangs
    recognition.continuous = false; 
    recognition.interimResults = true;
    recognition.lang = "en-US";
    
    recognition.onstart = () => {
      addLog("ON_START: Engine Alive");
      setIsListening(true);
      setStatus("LISTENING");
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptText = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          setTranscript(transcriptText);
          addLog(`Final: ${transcriptText.substring(0, 15)}...`);
        } else {
          interimTranscript += transcriptText;
        }
      }
      if (interimTranscript) setTranscript(interimTranscript);
    };

    recognition.onerror = (event: any) => {
      addLog(`ON_ERROR: ${event.error}`);
      if (event.error === "not-allowed") {
        setError("Microphone blocked. If you use Brave, enable 'Google Services' in settings.");
        setStatus("BLOCKED");
      } else if (event.error === "no-speech") {
        setStatus("IDLE");
      } else {
        setError(`Speech Error: ${event.error}`);
        setStatus("ERROR");
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      addLog("ON_END: Engine Closed");
      setIsListening(false);
      if (status === "STARTING") {
        addLog("FAILED: Closed before start");
        setStatus("IDLE");
      }
    };

    try {
      recognitionRef.current = recognition;
      addLog("Calling .start()...");
      recognition.start();
    } catch (err: any) {
      addLog(`CATCH: ${err.message}`);
      setIsListening(false);
      setStatus("CATCH_ERR");
      recognitionRef.current = null;
    }
  }, [addLog]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === "STARTING" && !isListening) {
      timer = setTimeout(() => {
        if (status === "STARTING" && !isListening) {
          addLog("STUCK: Auto-resetting...");
          setError("Voice engine did not respond. Check if your browser is blocking it in the address bar, or try typing below.");
          setStatus("IDLE");
          setIsListening(false);
          // Show manual input as fallback
          setIsManualInput(true);
        }
      }, 4000);
    }
    return () => clearTimeout(timer);
  }, [status, isListening, addLog]);

  useEffect(() => {
    // We strictly wait for a user click to avoid browser security hangs
    // This effect only handles cleanup when the component unmounts
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn("Cleanup error:", e);
        }
      }
    };
  }, []); // Constant dependency array to avoid the Hook error

  const handleProcess = async () => {
    if (!transcript || isProcessing) return;

    setIsProcessing(true);
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });

      if (!response.ok) throw new Error("Failed to process");

      const data = await response.json();
      setResult(data);

      // Construct search URL
      const params = new URLSearchParams();
      if (data.q) params.set("q", data.q);
      if (data.category) params.set("category", data.category);
      if (data.minPrice) params.set("minPrice", data.minPrice.toString());
      if (data.maxPrice) params.set("maxPrice", data.maxPrice.toString());

      router.push(`/products?${params.toString()}`);
      onClose();
    } catch (err) {
      setError("Failed to process your request. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-lg bg-[#1a1a1a] border border-white/10 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden p-8 md:p-12"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-3 rounded-full bg-white/5 hover:bg-white/10 transition-all group z-[110]"
          aria-label="Close"
        >
          <X className="h-6 w-6 text-white" />
        </button>

        <div className="flex flex-col space-y-10">
          <h2 className="text-2xl font-normal text-white/90">
            {error && error.includes("denied") ? "Mic access required" : isListening ? "Listening..." : "Search with your voice"}
          </h2>
          
          <div className="min-h-[160px] flex flex-col justify-start">
            {error && error.includes("denied") ? (
              <p className="text-[#AAAAAA] text-lg leading-relaxed">
                {error}
              </p>
            ) : isManualInput ? (
              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  autoFocus
                  placeholder="Type your search here..."
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xl text-white outline-none focus:border-orange-500/50 transition-all shadow-inner"
                  onKeyDown={(e) => e.key === "Enter" && handleProcess()}
                />
                <button 
                  onClick={() => { setIsManualInput(false); startListening(); }}
                  className="text-xs text-orange-500/60 hover:text-orange-500 uppercase tracking-widest font-bold self-end"
                >
                  Try Voice Again
                </button>
              </div>
            ) : (
              <p className="text-3xl text-white font-normal leading-tight">
                {transcript || (isListening ? "Say something..." : "Type or speak your search...")}
              </p>
            )}

            {!transcript && isListening && !isManualInput && (
              <div className="mt-8 flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <span className="text-white/30 text-xs w-full mb-1 font-bold uppercase tracking-widest">Try saying:</span>
                {["Show me kurtas under 5000", "Red shirts for men", "Latest sneakers"].map((sample) => (
                  <button
                    key={sample}
                    onClick={() => setTranscript(sample)}
                    className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 hover:text-white transition-all"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            )}

            {result?.translatedText && (
              <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400 mb-2">English Translation</p>
                <p className="text-white/80 text-lg italic leading-relaxed">"{result.translatedText}"</p>
              </div>
            )}
            
            {error && !error.includes("denied") && (
              <div className="mt-6 flex flex-col gap-3">
                <p className="text-red-400 text-sm font-medium bg-red-400/10 p-4 rounded-xl border border-red-400/20">
                  {error}
                </p>
                <button 
                  onClick={() => window.location.reload()}
                  className="text-[10px] text-white/20 hover:text-white/40 uppercase tracking-[0.2em] font-black self-center transition-colors"
                >
                  Hard Refresh Page
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center justify-center space-y-8">
            <div className="relative">
              {isListening && (
                <div className="absolute inset-x-[-40px] inset-y-[-40px] flex items-center justify-center pointer-events-none">
                  {[1, 1.5, 2].map((scale, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale, opacity: 0 }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                      className="absolute inset-0 bg-orange-500 rounded-full blur-md"
                    />
                  ))}
                </div>
              )}
              <Button
                onClick={() => {
                  if (error && error.includes("denied")) {
                    setError("Mic access is blocked. Please enable it in browser settings.");
                  } else if (isListening) {
                    stopListening();
                  } else {
                    startListening();
                  }
                }}
                className={`relative h-28 w-28 rounded-full flex items-center justify-center transition-all ${
                  isListening 
                    ? "bg-orange-600 hover:bg-orange-700 shadow-[0_0_50px_rgba(249,115,22,0.4)]" 
                    : "bg-[#2d2d2d] hover:bg-[#3d3d3d] border border-white/10"
                }`}
              >
                <Mic className={`h-12 w-12 ${isListening ? "text-white" : "text-white/60"}`} />
              </Button>
            </div>

            {!isManualInput && (
              <div className="text-center">
                <p className={`text-sm font-bold uppercase tracking-[0.2em] transition-colors ${isListening ? "text-orange-500" : "text-white/30"}`}>
                  {status}
                </p>
                {logs.length > 0 && (
                  <div className="mt-4 flex flex-col gap-1 opacity-20">
                    {logs.map((log, i) => (
                      <span key={i} className="text-[10px] text-white/50">{log}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {transcript && !isProcessing && (
              <Button
                onClick={handleProcess}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black h-14 rounded-2xl flex items-center justify-center gap-3 text-lg shadow-xl shadow-orange-900/40"
              >
                <Search className="h-5 w-5" />
                Proceed with Search
              </Button>
            )}

            {isProcessing && (
              <div className="flex flex-col items-center gap-4 text-white/50">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                <span className="text-sm font-medium tracking-wide">Nova AI is analyzing your request...</span>
              </div>
            )}
          </div>

          <div className="flex justify-center pt-4">
            <span className="text-white/10 text-[9px] font-black uppercase tracking-[0.3em] border-t border-white/5 pt-4 w-full text-center">
              Stond AI Assistant • Bedrock Nova
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
