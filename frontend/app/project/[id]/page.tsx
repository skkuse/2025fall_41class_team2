'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Pencil, Check, X, List, Brain, Cards, PaperPlaneRight, FilePdf, CaretLeft, Plus, Sparkle, Trash } from 'phosphor-react'
import FlashcardViewer from '../../../components/FlashcardViewer'
import SuggestedQuestions from '../../../components/SuggestedQuestions'
import { getProject, getDocuments, uploadDocument, getMessages, sendMessage, updateProject, deleteDocument, generateQuiz, getQuizzes, getQuiz, getSuggestedQuestions } from '../../../lib/api'
import { useAuth } from '../../../components/AuthContext'

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const [projectId, setProjectId] = useState<string | null>(null)
    const [project, setProject] = useState<any>(null)
    const [documents, setDocuments] = useState<any[]>([])
    const [messages, setMessages] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [newMessage, setNewMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([])
    const [loadingSuggestions, setLoadingSuggestions] = useState(false)
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [editedTitle, setEditedTitle] = useState('')

    const [quizzes, setQuizzes] = useState<any[]>([])
    const [currentQuiz, setCurrentQuiz] = useState<any>(null)
    const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({})
    const [quizResult, setQuizResult] = useState<any>(null)
    const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false)
    const [quizType, setQuizType] = useState<'MULTIPLE_CHOICE' | 'FLASHCARD'>('MULTIPLE_CHOICE')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Unwrap params
    useEffect(() => {
        params.then(p => setProjectId(p.id))
    }, [params])

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/')
            return
        }

        if (user && projectId) {
            loadProjectData()
        }
    }, [user, authLoading, router, projectId])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const loadProjectData = async () => {
        if (!projectId) return
        try {
            setLoading(true)
            const [projectData, docsData, msgsData] = await Promise.all([
                getProject(projectId),
                getDocuments(projectId),
                getMessages(projectId),
            ])
            setProject(projectData)
            setDocuments(docsData)
            setMessages(msgsData)

            // Initial fetch of suggestions
            loadSuggestedQuestions()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Poll for document status updates
    useEffect(() => {
        if (!projectId) return

        const processingDocs = documents.filter(doc => doc.status === 'processing')
        if (processingDocs.length === 0) return

        const interval = setInterval(async () => {
            try {
                const updatedDocs = await getDocuments(projectId)
                setDocuments(updatedDocs)
            } catch (err) {
                console.error("Error polling documents:", err)
            }
        }, 2000) // Poll every 2 seconds

        return () => clearInterval(interval)
    }, [documents, projectId])

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!projectId) return
        const file = e.target.files?.[0]
        if (!file) return

        try {
            const uploaded = await uploadDocument(projectId, file)
            setDocuments([uploaded, ...documents])
        } catch (err: any) {
            setError(err.message)
        }
    }

    const sendMessageToChat = async (content: string) => {
        if (!projectId || !content.trim() || sending) return

        setNewMessage('')
        const userMsg = { role: 'user', content: content, created_at: new Date().toISOString() }
        setMessages((prev) => [...prev, userMsg])
        setSending(true)

        try {
            const response = await sendMessage(projectId, content)
            setMessages((prev) => [...prev, response])

            // Refresh suggestions based on new context
            loadSuggestedQuestions()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSending(false)
        }
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        sendMessageToChat(newMessage)
    }

    const handleEditTitle = () => {
        setEditedTitle(project.title)
        setIsEditingTitle(true)
    }

    const loadSuggestedQuestions = async () => {
        if (!projectId) return
        try {
            setLoadingSuggestions(true)
            const questions = await getSuggestedQuestions(projectId)
            setSuggestedQuestions(questions)
        } catch (err) {
            console.error(err)
        } finally {
            setLoadingSuggestions(false)
        }
    }

    const handleSaveTitle = async () => {
        if (!projectId || !editedTitle.trim()) return

        try {
            const updated = await updateProject(projectId, editedTitle)
            setProject(updated)
            setIsEditingTitle(false)
        } catch (err: any) {
            setError(err.message)
        }
    }

    const handleKeyDownTitle = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSaveTitle()
        } else if (e.key === 'Escape') {
            setIsEditingTitle(false)
        }
    }

    const handleDeleteDocument = async (documentId: string) => {
        if (!projectId) return

        try {
            await deleteDocument(projectId, documentId)
            setDocuments(documents.filter(doc => doc.id !== documentId))
        } catch (err: any) {
            setError(err.message)
        }
    }

    const preprocessMessageContent = (content: string) => {
        // Replace [Document ID: <id>, Page: <page>] with a custom markdown link
        // Format: [Page <page>](/project/<projectId>/document/<docId>?page=<page>)
        return content.replace(
            /\[Document ID: ([a-zA-Z0-9-]+), Page: ([\d-]+)\]/g,
            (match, docId, pageNum) => `[${pageNum}p](/project/${projectId}/document/${docId}?page=${pageNum})`
        )
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

    const loadQuizzes = async () => {
        if (!projectId) return
        try {
            const data = await getQuizzes(projectId)
            setQuizzes(data)
        } catch (err: any) {
            console.error(err)
        }
    }

    useEffect(() => {
        if (projectId) {
            loadQuizzes()
        }
    }, [projectId])

    if (authLoading || loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        )
    }

    if (!project) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <p className="text-sm text-muted-foreground">Project not found</p>
            </div>
        )
    }

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background font-sans text-foreground">
            {/* Left Sidebar - Documents */}
            <aside className="flex w-[430px] flex-col border-r border-sidebar-border bg-sidebar/50 backdrop-blur-xl">
                <div className="flex h-16 items-center border-b border-sidebar-border px-6">
                    <Link href="/dashboard" className="group flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                        <div className="rounded-full bg-sidebar-accent p-1.5 transition-colors group-hover:bg-sidebar-accent/80">
                            <CaretLeft size={14} weight="bold" />
                        </div>
                        Back
                    </Link>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className="mb-4 flex items-center justify-between px-2">
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Documents</h2>
                        <span className="rounded-full bg-sidebar-accent px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{documents.length}</span>
                    </div>

                    <div className="space-y-1">
                        {documents.map((doc) => (
                            <Link
                                key={doc.id}
                                href={`/project/${projectId}/document/${doc.id}`}
                                className="group relative flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-sidebar-accent"
                            >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white shadow-sm ring-1 ring-black/5">
                                    {doc.status === 'processing' ? (
                                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                    ) : (
                                        <FilePdf size={16} className="text-red-500" weight="fill" /> // Assuming mostly PDFs for icon
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-sidebar-foreground group-hover:text-primary">{doc.name}</p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {doc.status === 'processing' ? 'Processing...' : new Date(doc.created_at || Date.now()).toLocaleDateString()}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        handleDeleteDocument(doc.id)
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-all"
                                >
                                    <Trash size={14} />
                                </button>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="border-t border-sidebar-border p-4">
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-sidebar-border bg-sidebar-accent/50 px-4 py-3 text-sm font-medium text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:border-primary/50"
                    >
                        <Plus size={16} weight="bold" />
                        <span>Add Document</span>
                    </button>
                </div>
            </aside>

            {/* Main Content - Chat */}
            <main className="flex flex-1 flex-col relative bg-white/50">
                {/* Header */}
                <header className="flex h-16 items-center justify-between border-b border-border bg-white/80 backdrop-blur-md px-6 z-10">
                    <div className="flex items-center gap-3">
                        {isEditingTitle ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={editedTitle}
                                    onChange={(e) => setEditedTitle(e.target.value)}
                                    onKeyDown={handleKeyDownTitle}
                                    className="border-b-2 border-primary bg-transparent px-0 py-1 text-lg font-medium outline-none"
                                    autoFocus
                                />
                                <button onClick={handleSaveTitle} className="rounded-full p-1 hover:bg-green-50 text-green-600"><Check size={16} /></button>
                                <button onClick={() => setIsEditingTitle(false)} className="rounded-full p-1 hover:bg-red-50 text-red-500"><X size={16} /></button>
                            </div>
                        ) : (
                            <div className="group flex items-center gap-2 cursor-pointer" onClick={handleEditTitle}>
                                <h1 className="text-lg font-medium text-foreground">{project.title}</h1>
                                <Pencil size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Header Actions if needed */}
                    </div>
                </header>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                    <div className="mx-auto max-w-3xl space-y-8 pb-4">
                        {messages.length === 0 && (
                            <div className="mt-20 flex flex-col items-center justify-center space-y-4 text-center opacity-0 animate-fade-in-up">
                                <div className="rounded-full bg-primary/10 p-4 ring-1 ring-primary/20">
                                    <Sparkle size={32} weight="fill" className="text-primary" />
                                </div>
                                <h3 className="text-xl font-medium">Hello, I'm your AI Assistant.</h3>
                                <p className="max-w-md text-muted-foreground">I can help you analyze your documents, answer questions, and generate study materials. Upload a document to get started!</p>
                            </div>
                        )}

                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`} style={{ animationDelay: '100ms' }}>
                                <div
                                    className={`relative max-w-[85%] rounded-2xl px-5 py-4 text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                        ? 'bg-primary text-primary-foreground rounded-br-xs'
                                        : 'bg-white border border-border text-foreground rounded-bl-xs'
                                        }`}
                                >
                                    {msg.role === 'assistant' ? (
                                        <div className="markdown-content">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    a: ({ node, href, children, ...props }) => {
                                                        if (href?.includes('/document/') && href?.includes('?page=')) {
                                                            return (
                                                                <Link
                                                                    href={href}
                                                                    className="mx-1 inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary hover:bg-primary/10 transition-colors"
                                                                >
                                                                    <FilePdf size={10} weight="fill" />
                                                                    {children}
                                                                </Link>
                                                            )
                                                        }
                                                        return <a href={href} className="text-primary hover:underline underline-offset-2 font-medium" {...props}>{children}</a>
                                                    },
                                                    p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                                                    ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-3 space-y-1 marker:text-primary/50" {...props} />,
                                                    ol: ({ node, ...props }) => <ol className="list-decimal ml-4 mb-3 space-y-1 marker:text-primary/50 font-medium" {...props} />,
                                                    li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                                    code: ({ node, inline, ...props }: any) =>
                                                        inline ?
                                                            <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono text-foreground" {...props} /> :
                                                            <code className="block bg-muted p-3 rounded-lg my-3 text-xs font-mono text-foreground overflow-x-auto border border-border/50" {...props} />,
                                                }}
                                            >
                                                {preprocessMessageContent(msg.content)}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-6 pt-2 bg-gradient-to-t from-background via-background/95 to-transparent">
                    <div className="mx-auto max-w-3xl space-y-4">
                        {/* Suggested Questions */}
                        <div className="flex flex-wrap gap-2 justify-center">
                            <SuggestedQuestions
                                questions={suggestedQuestions}
                                onSelect={(q) => sendMessageToChat(q)}
                                isLoading={loadingSuggestions || sending}
                            />
                        </div>

                        <form onSubmit={handleSendMessage} className="relative group">
                            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20 rounded-full blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
                            <input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Ask a question about your documents..."
                                className="w-full rounded-full border border-border bg-white/80 backdrop-blur-sm px-6 py-4 pr-14 text-sm shadow-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                                disabled={sending}
                            />
                            <button
                                type="submit"
                                disabled={sending || !newMessage.trim()}
                                className="absolute right-2 top-2 rounded-full bg-primary p-2 text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {sending ? (
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                ) : (
                                    <PaperPlaneRight size={20} weight="fill" />
                                )}
                            </button>
                        </form>
                        <p className="text-center text-[10px] text-muted-foreground/50">AI can make mistakes. Verify important information.</p>
                    </div>
                </div>
            </main>

            {/* Right Sidebar - Tools */}
            <aside className="hidden w-[480px] flex-col border-l border-sidebar-border bg-sidebar/30 backdrop-blur-xl lg:flex">
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
                                    disabled={isGeneratingQuiz || documents.length === 0}
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
        </div>
    )
}
