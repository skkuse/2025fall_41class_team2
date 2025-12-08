'use client'

import React, { useState, useEffect } from 'react'
import { Cards, Brain, CaretLeft, Sparkle } from 'phosphor-react'
import FlashcardViewer from '@/features/quiz/ui/FlashcardViewer'
import { generateQuiz, getQuizzes } from '@/shared/lib/api'

interface ToolsPanelProps {
    projectId: string
    documentsCount: number
    setError: (err: string) => void
}

export function ToolsPanel({ projectId, documentsCount, setError }: ToolsPanelProps) {
    const [quizzes, setQuizzes] = useState<any[]>([])
    const [currentQuiz, setCurrentQuiz] = useState<any>(null)
    const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({})
    const [quizResult, setQuizResult] = useState<any>(null)
    const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false)
    const [quizType, setQuizType] = useState<'MULTIPLE_CHOICE' | 'FLASHCARD'>('MULTIPLE_CHOICE')

    useEffect(() => {
        if (projectId) {
            loadQuizzes()
        }
    }, [projectId])

    const loadQuizzes = async () => {
        try {
            const data = await getQuizzes(projectId)
            setQuizzes(data)
        } catch (err: any) {
            console.error(err)
        }
    }

    const handleGenerateQuiz = async () => {
        if (!projectId) return
        setIsGeneratingQuiz(true)
        try {
            const newQuiz = await generateQuiz(projectId, 5, quizType)
            setQuizzes([newQuiz, ...quizzes])
            setCurrentQuiz(newQuiz)
            setQuizAnswers({})
            setQuizResult(null)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsGeneratingQuiz(false)
        }
    }

    const handleQuizSubmit = () => {
        if (!currentQuiz) return
        let correctCount = 0
        currentQuiz.questions.forEach((q: any) => {
            if (quizAnswers[q.id] === q.answer) {
                correctCount++
            }
        })
        setQuizResult({
            correct: correctCount,
            total: currentQuiz.questions.length,
            score: Math.round((correctCount / currentQuiz.questions.length) * 100)
        })
    }

    return (
        <aside className="hidden w-[480px] flex-col border-l border-sidebar-border bg-sidebar/30 backdrop-blur-xl lg:flex h-full">
            <div className="flex h-16 items-center border-b border-sidebar-border px-6">
                <h2 className="font-semibold text-sidebar-foreground">Learning Tools</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {!currentQuiz ? (
                    <div className="space-y-8 animate-fade-in-up">
                        {/* Generator Card */}
                        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                            <div className="mb-6 flex justify-center">
                                <div className="glass-panel h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 text-primary">
                                    {quizType === 'FLASHCARD' ? <Cards size={32} weight="duotone" /> : <Brain size={32} weight="duotone" />}
                                </div>
                            </div>
                            <h3 className="mb-2 text-center text-lg font-medium text-card-foreground">Generate Content</h3>
                            <p className="mb-6 text-center text-xs text-muted-foreground">
                                Create personalized study materials from your uploaded documents.
                            </p>

                            <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
                                <button
                                    onClick={() => setQuizType('MULTIPLE_CHOICE')}
                                    className={`rounded-lg py-2 text-xs font-medium transition-all ${quizType === 'MULTIPLE_CHOICE'
                                        ? 'bg-white text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:bg-white/50'
                                        }`}
                                >
                                    Quiz
                                </button>
                                <button
                                    onClick={() => setQuizType('FLASHCARD')}
                                    className={`rounded-lg py-2 text-xs font-medium transition-all ${quizType === 'FLASHCARD'
                                        ? 'bg-white text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:bg-white/50'
                                        }`}
                                >
                                    Flashcards
                                </button>
                            </div>

                            <button
                                onClick={handleGenerateQuiz}
                                disabled={isGeneratingQuiz || documentsCount === 0}
                                className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:shadow-none"
                            >
                                {isGeneratingQuiz
                                    ? 'Generating...'
                                    : `Generate ${quizType === 'FLASHCARD' ? 'Flashcards' : 'Quiz'}`
                                }
                            </button>
                        </div>

                        {/* History */}
                        {quizzes.length > 0 && (
                            <div>
                                <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">History</h4>
                                <div className="space-y-2">
                                    {quizzes.map((quiz) => (
                                        <button
                                            key={quiz.id}
                                            onClick={() => {
                                                setCurrentQuiz(quiz)
                                                setQuizAnswers({})
                                                setQuizResult(null)
                                            }}
                                            className="group flex w-full items-center gap-3 rounded-xl border border-transparent bg-white/50 px-3 py-3 text-left transition-all hover:border-border hover:bg-white hover:shadow-sm"
                                        >
                                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${quiz.quiz_type === 'FLASHCARD' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                                                }`}>
                                                {quiz.quiz_type === 'FLASHCARD' ? <Cards size={16} weight="fill" /> : <Brain size={16} weight="fill" />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">{quiz.title}</p>
                                                <p className="text-[10px] text-muted-foreground">{new Date(quiz.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="animate-fade-in-up">
                        <div className="mb-6 flex items-center justify-between">
                            <button
                                onClick={() => setCurrentQuiz(null)}
                                className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <CaretLeft size={14} /> Back
                            </button>
                            <span className="text-xs font-medium text-muted-foreground truncate w-32 text-right">{currentQuiz.title}</span>
                        </div>

                        {currentQuiz.quiz_type === 'FLASHCARD' ? (
                            <FlashcardViewer cards={currentQuiz.questions} />
                        ) : (
                            <div className="space-y-6">
                                {quizResult && (
                                    <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-6 text-center animate-fade-in-up">
                                        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 ring-4 ring-green-50">
                                            <Sparkle size={32} weight="fill" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-foreground">{quizResult.score}%</h3>
                                        <p className="text-sm text-green-600 mt-1">
                                            {quizResult.correct} / {quizResult.total} Correct
                                        </p>
                                        <button
                                            onClick={() => {
                                                setQuizAnswers({})
                                                setQuizResult(null)
                                            }}
                                            className="mt-4 w-full rounded-full bg-green-600 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {currentQuiz.questions.map((q: any, idx: number) => (
                                        <div key={q.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                                            <div className="mb-4 flex gap-3">
                                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">{idx + 1}</span>
                                                <p className="text-sm font-medium text-card-foreground leading-relaxed">
                                                    {q.question_text}
                                                </p>
                                            </div>
                                            <div className="space-y-2 pl-9">
                                                {q.options.map((option: string) => {
                                                    const isSelected = quizAnswers[q.id] === option;
                                                    const isCorrect = quizResult && option === q.answer;
                                                    const isWrong = quizResult && isSelected && option !== q.answer;

                                                    let btnClass = "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted";
                                                    if (quizResult) {
                                                        if (isCorrect) btnClass = "border-green-500/50 bg-green-50 text-green-700";
                                                        else if (isWrong) btnClass = "border-red-500/50 bg-red-50 text-red-700";
                                                        else btnClass = "border-transparent bg-muted/30 text-muted-foreground/50";
                                                    } else if (isSelected) {
                                                        btnClass = "border-primary bg-primary/5 text-primary ring-1 ring-primary";
                                                    }

                                                    return (
                                                        <button
                                                            key={option}
                                                            onClick={() => !quizResult && setQuizAnswers({ ...quizAnswers, [q.id]: option })}
                                                            disabled={!!quizResult}
                                                            className={`w-full rounded-lg border px-4 py-2.5 text-left text-xs transition-all ${btnClass}`}
                                                        >
                                                            {option}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {!quizResult && (
                                    <button
                                        onClick={handleQuizSubmit}
                                        disabled={Object.keys(quizAnswers).length !== currentQuiz.questions.length}
                                        className="sticky bottom-4 w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 disabled:opacity-50 disabled:shadow-none"
                                    >
                                        Submit Quiz
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </aside>
    )
}
