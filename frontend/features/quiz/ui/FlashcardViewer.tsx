'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CaretLeft, CaretRight, ArrowsClockwise, ArrowCounterClockwise } from 'phosphor-react'

interface FlashcardViewerProps {
    cards: {
        id: string;
        question_text: string; // Term
        answer: string; // Definition
    }[];
}

export default function FlashcardViewer({ cards }: FlashcardViewerProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)
    const [direction, setDirection] = useState(0)

    const currentCard = cards[currentIndex]

    const handleNext = () => {
        if (currentIndex < cards.length - 1) {
            setDirection(1)
            setIsFlipped(false)
            setCurrentIndex(prev => prev + 1)
        }
    }

    const handlePrev = () => {
        if (currentIndex > 0) {
            setDirection(-1)
            setIsFlipped(false)
            setCurrentIndex(prev => prev - 1)
        }
    }

    const handleFlip = () => {
        setIsFlipped(!isFlipped)
    }

    if (!cards || cards.length === 0) {
        return (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 text-muted-foreground">
                <p>No flashcards available.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center py-4">
            <div className="mb-6 flex items-center justify-between w-full max-w-md px-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Card {currentIndex + 1} / {cards.length}
                </span>
                <div className="flex gap-1">
                    <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-300 ease-out"
                            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="relative h-72 w-full max-w-md perspective-1000 group">
                <motion.div
                    className="relative h-full w-full preserve-3d cursor-pointer"
                    initial={false}
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                    style={{ transformStyle: 'preserve-3d' }}
                    onClick={handleFlip}
                >
                    {/* Front (Term) */}
                    <div className="absolute h-full w-full backface-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-white to-gray-50 p-1 shadow-lg shadow-black/5 ring-1 ring-black/5">
                        <div className="flex h-full w-full flex-col items-center justify-center rounded-[20px] border border-white/50 bg-white/50 p-8 backdrop-blur-sm">
                            <span className="mb-6 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                                Question
                            </span>
                            <h3 className="text-center text-xl font-medium leading-relaxed text-foreground">
                                {currentCard.question_text}
                            </h3>
                            <div className="absolute bottom-6 flex items-center gap-2 text-xs font-medium text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100">
                                <span>Click to flip</span>
                                <ArrowsClockwise size={12} />
                            </div>
                        </div>
                    </div>

                    {/* Back (Definition) */}
                    <div
                        className="absolute h-full w-full backface-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5 p-1 shadow-xl shadow-primary/10 ring-1 ring-primary/10"
                        style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
                    >
                        <div className="flex h-full w-full flex-col items-center justify-center rounded-[20px] border border-white/50 bg-white/50 p-8 backdrop-blur-sm">
                            <span className="mb-6 inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-600">
                                Answer
                            </span>
                            <p className="text-center text-lg leading-relaxed text-foreground">
                                {currentCard.answer}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="mt-8 flex items-center gap-6">
                <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-sm transition-all hover:bg-gray-50 hover:scale-110 disabled:opacity-30 disabled:hover:scale-100"
                >
                    <CaretLeft size={20} weight="bold" />
                </button>

                <button
                    onClick={() => {
                        setIsFlipped(false)
                        setCurrentIndex(0)
                        setDirection(0)
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-all hover:bg-muted/80 hover:rotate-180"
                    title="Restart"
                >
                    <ArrowCounterClockwise size={18} weight="bold" />
                </button>

                <button
                    onClick={handleNext}
                    disabled={currentIndex === cards.length - 1}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-sm transition-all hover:bg-gray-50 hover:scale-110 disabled:opacity-30 disabled:hover:scale-100"
                >
                    <CaretRight size={20} weight="bold" />
                </button>
            </div>
        </div>
    )
}
