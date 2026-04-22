import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { VocabWord } from "@/data/hskData";
import { cn } from "@/lib/utils";

interface FlashcardProps {
  word: VocabWord;
  isFlipped: boolean;
  onFlip: () => void;
  showPinyin?: boolean;
  className?: string;
}

export function Flashcard({ word, isFlipped, onFlip, showPinyin = true, className }: FlashcardProps) {
  return (
    <div className={cn("perspective-1000 w-full max-w-sm aspect-[4/5] sm:aspect-[3/4] cursor-pointer", className)} onClick={onFlip}>
      <motion.div
        className="w-full h-full relative preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
      >
        {/* FRONT OF CARD */}
        <div className="absolute inset-0 backface-hidden bg-card rounded-3xl p-4 sm:p-6 shadow-xl border border-border/50 flex flex-col items-center justify-between">
          <div className="w-full h-36 sm:h-44 lg:h-52 rounded-2xl overflow-hidden shadow-inner mb-3 sm:mb-4 relative">
            <div className="absolute inset-0 bg-black/10 z-10" />
            <img 
              src={word.imageUrl} 
              alt="Visual context" 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center space-y-2 sm:space-y-3">
            <h2 className="text-6xl sm:text-7xl font-serif text-foreground">{word.word}</h2>
            {showPinyin && (
              <p className="text-lg sm:text-xl text-muted-foreground font-medium tracking-widest">{word.pinyin}</p>
            )}
          </div>
          
          <p className="text-xs sm:text-sm text-muted-foreground/60 font-medium">Tap to reveal meaning</p>
        </div>

        {/* BACK OF CARD */}
        <div className="absolute inset-0 backface-hidden bg-card rounded-3xl p-5 sm:p-8 shadow-xl border border-primary/20 flex flex-col items-center justify-center text-center" style={{ transform: "rotateY(180deg)" }}>
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-primary/5 to-transparent rounded-t-3xl" />
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-foreground mb-2 sm:mb-4">{word.word}</h2>
          <p className="text-xl sm:text-2xl text-primary font-medium tracking-wide mb-5 sm:mb-8">{word.pinyin}</p>
          
          <div className="w-12 sm:w-16 h-1 bg-gold rounded-full mb-3 sm:mb-5" />
          
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">{word.meaning}</h3>
        </div>
      </motion.div>
    </div>
  );
}
