'use client'

import { Sparkle } from 'phosphor-react'

interface SuggestedQuestionsProps {
    questions: string[];
    onSelect: (question: string) => void;
    isLoading?: boolean;
}

export default function SuggestedQuestions({ questions, onSelect, isLoading }: SuggestedQuestionsProps) {
    if (questions.length === 0) return null;

    return (
        <div className="w-full max-w-3xl mx-auto overflow-hidden">
            <div className="flex items-center gap-2 mb-3 px-1">
                <Sparkle size={14} weight="fill" className="text-primary" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                    Suggested Questions
                </p>
            </div>

            <div className="flex flex-wrap gap-2">
                {questions.map((q, idx) => (
                    <button
                        key={idx}
                        onClick={() => onSelect(q)}
                        disabled={isLoading}
                        className="group relative text-left py-2 px-4 rounded-xl border border-white/50 bg-white/40 hover:bg-white hover:border-primary/20 hover:shadow-md hover:shadow-primary/5 text-xs font-medium text-foreground transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                    >
                        <span className="relative z-10">{q}</span>
                        <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-primary/0 to-purple-500/0 opacity-0 transition-opacity duration-300 group-hover:from-primary/5 group-hover:to-purple-500/5 group-hover:opacity-100" />
                    </button>
                ))}
            </div>
        </div>
    )
}
