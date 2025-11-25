'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Pencil, Check, X, List, Brain } from 'phosphor-react'
import { getProject, getDocuments, uploadDocument, getMessages, sendMessage, updateProject, deleteDocument, generateQuiz, getQuizzes, getQuiz } from '../../../lib/api'
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
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [editedTitle, setEditedTitle] = useState('')
    const [activeTab, setActiveTab] = useState<'chat' | 'quiz'>('chat')
    const [quizzes, setQuizzes] = useState<any[]>([])
    const [currentQuiz, setCurrentQuiz] = useState<any>(null)
    const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({})
    const [quizResult, setQuizResult] = useState<any>(null)
    const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false)
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

    const handleSendMessage = async (e: React.FormEvent) => {
        if (!projectId) return
        e.preventDefault()
        if (!newMessage.trim() || sending) return

        const userMsg = { role: 'user', content: newMessage, created_at: new Date().toISOString() }
        setMessages([...messages, userMsg])
        setNewMessage('')
        setSending(true)

        try {
            const response = await sendMessage(projectId, newMessage)
            setMessages((prev) => [...prev, response])
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSending(false)
        }
    }

    const handleEditTitle = () => {
        setEditedTitle(project.title)
        setIsEditingTitle(true)
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
            const newQuiz = await generateQuiz(projectId)
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
        if (activeTab === 'quiz' && projectId) {
            loadQuizzes()
        }
    }, [activeTab, projectId])

    if (authLoading || loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <p className="text-sm text-gray-500">Loading...</p>
            </div>
        )
    }

    if (!project) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <p className="text-sm text-gray-500">Project not found</p>
            </div>
        )
    }

    return (
        <div className="flex h-screen flex-col bg-white md:flex-row">
            {/* Sidebar - Documents */}
            <div className="flex w-full flex-col border-r bg-white md:w-80 md:flex-shrink-0">
                <div className="flex items-center justify-between border-b p-4">
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard">
                            <button className="rounded-full p-2 hover:bg-gray-100">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        </Link>
                        <h2 className="font-medium text-black">Documents</h2>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-2">
                        {documents.map((doc) => (
                            <Link
                                key={doc.id}
                                href={`/project/${projectId}/document/${doc.id}`}
                                className="group relative flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100">
                                    {doc.status === 'processing' ? (
                                        <svg className="h-5 w-5 animate-spin text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-black">{doc.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {doc.status === 'processing' ? (
                                            <span className="text-blue-600">{doc.processing_message || 'Processing...'}</span>
                                        ) : (
                                            doc.status || 'processed'
                                        )}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        handleDeleteDocument(doc.id)
                                    }}
                                    className="absolute right-2 top-2 hidden rounded-full bg-white p-1 shadow-sm hover:bg-red-50 group-hover:block"
                                    title="Delete document"
                                >
                                    <X size={16} weight="bold" className="text-red-600" />
                                </button>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="border-t p-4">
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-50"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                        </svg>
                        Upload Document
                    </button>
                </div>
            </div>

            {/* Main Content - Chat */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <header className="flex items-center justify-between border-b bg-white px-6 py-4">
                    <div className="flex-1">
                        {isEditingTitle ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={editedTitle}
                                    onChange={(e) => setEditedTitle(e.target.value)}
                                    onKeyDown={handleKeyDownTitle}
                                    className="flex border-b-2 border-black bg-transparent px-0 py-0 text-xl font-medium text-black outline-none"
                                    autoFocus
                                />
                                <button
                                    onClick={handleSaveTitle}
                                    className="rounded-full p-2 hover:bg-gray-100"
                                    title="Save"
                                >
                                    <Check size={16} weight="bold" className="text-green-600" />
                                </button>
                                <button
                                    onClick={() => setIsEditingTitle(false)}
                                    className="rounded-full p-2 hover:bg-gray-100"
                                    title="Cancel"
                                >
                                    <X size={16} weight="bold" className="text-gray-500" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <h1
                                    onClick={handleEditTitle}
                                    className="cursor-pointer text-xl font-medium text-black hover:text-gray-700"
                                >
                                    {project.title}
                                </h1>
                                <button
                                    onClick={handleEditTitle}
                                    className="rounded-full p-1.5 opacity-50 hover:bg-gray-100 hover:opacity-100"
                                    title="Edit title"
                                >
                                    <Pencil size={16} weight="regular" className="text-gray-600" />
                                </button>
                            </div>
                        )}
                        {project.description && (
                            <p className="mt-1 text-sm text-gray-500">{project.description}</p>
                        )}
                    </div>
                    <span className="text-sm text-gray-500">{documents.length} documents</span>
                </header>

                {error && (
                    <div className="border-b border-red-200 bg-red-50 p-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="mx-auto max-w-3xl space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center text-gray-500">
                                <p className="text-sm">No messages yet. Start a conversation!</p>
                            </div>)}
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`max-w-[80%] rounded-lg p-4 ${msg.role === 'user'
                                        ? 'bg-black text-white'
                                        : 'border border-gray-200 bg-white text-black'
                                        }`}
                                >
                                    {msg.role === 'assistant' ? (
                                        <div className="markdown-content text-sm">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    a: ({ node, href, children, ...props }) => {
                                                        if (href?.includes('/document/') && href?.includes('?page=')) {
                                                            return (
                                                                <Link
                                                                    href={href}
                                                                    className="mx-1 inline-flex items-center rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-800 hover:bg-blue-200"
                                                                    title="View Source"
                                                                >
                                                                    {children}
                                                                </Link>
                                                            )
                                                        }
                                                        return <a href={href} className="text-blue-600 hover:underline" {...props}>{children}</a>
                                                    },
                                                    h3: ({ node, ...props }) => <h3 className="text-base font-semibold mt-4 mb-2" {...props} />,
                                                    h4: ({ node, ...props }) => <h4 className="text-sm font-semibold mt-3 mb-2" {...props} />,
                                                    h5: ({ node, ...props }) => <h5 className="text-sm font-medium mt-2 mb-1" {...props} />,
                                                    p: ({ node, ...props }) => <p className="mb-2 leading-relaxed" {...props} />,
                                                    ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-2 space-y-1" {...props} />,
                                                    ol: ({ node, ...props }) => <ol className="list-decimal ml-4 mb-2 space-y-1" {...props} />,
                                                    li: ({ node, children, ...props }) => (
                                                        <li className="ml-1" {...props}>
                                                            <span className="inline">{children}</span>
                                                        </li>
                                                    ),
                                                    code: ({ node, inline, ...props }: any) =>
                                                        inline ?
                                                            <code className="bg-gray-100 px-1 py-0.5 rounded text-xs" {...props} /> :
                                                            <code className="block bg-gray-100 p-2 rounded my-2 text-xs overflow-x-auto" {...props} />,
                                                    strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
                                                    em: ({ node, ...props }) => <em className="italic" {...props} />,
                                                }}
                                            >
                                                {preprocessMessageContent(msg.content)}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                <div className="border-t bg-white p-4">
                    <form onSubmit={handleSendMessage} className="mx-auto max-w-3xl">
                        <div className="relative flex items-center">
                            <input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Ask a question about your documents..."
                                className="w-full rounded-full border border-gray-300 px-4 py-3 pr-12 text-sm focus:border-gray-500 focus:outline-none"
                                disabled={sending}
                            />
                            <button
                                type="submit"
                                disabled={sending || !newMessage.trim()}
                                className="absolute right-2 rounded-full bg-black p-2 text-white hover:bg-gray-800 disabled:opacity-50"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Right Sidebar - Tools (Quiz, etc.) */}
            <div className="flex w-full flex-col border-l bg-white md:w-96 md:flex-shrink-0">
                <div className="flex items-center border-b px-2">
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 border-b-2 py-3 text-sm font-medium ${activeTab === 'chat' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Chat
                    </button>
                    <button
                        onClick={() => setActiveTab('quiz')}
                        className={`flex-1 border-b-2 py-3 text-sm font-medium ${activeTab === 'quiz' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Quiz
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
                    {activeTab === 'chat' ? (
                        <div className="flex h-full flex-col justify-center text-center text-gray-500">
                            <p className="mb-2">Chat is now in the main area.</p>
                            <p className="text-xs">Use the center panel to chat with your documents.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {!currentQuiz ? (
                                <>
                                    <div className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
                                        <div className="mb-4 flex justify-center">
                                            <div className="rounded-full bg-blue-50 p-3">
                                                <Brain size={32} className="text-blue-600" />
                                            </div>
                                        </div>
                                        <h3 className="mb-2 text-lg font-medium text-black">Generate a Quiz</h3>
                                        <p className="mb-6 text-sm text-gray-500">
                                            Test your knowledge based on the uploaded documents.
                                        </p>
                                        <button
                                            onClick={handleGenerateQuiz}
                                            disabled={isGeneratingQuiz || documents.length === 0}
                                            className="w-full rounded-full bg-black py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                                        >
                                            {isGeneratingQuiz ? 'Generating...' : 'Generate Quiz'}
                                        </button>
                                    </div>

                                    {quizzes.length > 0 && (
                                        <div>
                                            <h4 className="mb-3 text-sm font-semibold text-gray-500">Previous Quizzes</h4>
                                            <div className="space-y-2">
                                                {quizzes.map((quiz) => (
                                                    <button
                                                        key={quiz.id}
                                                        onClick={() => {
                                                            setCurrentQuiz(quiz)
                                                            setQuizAnswers({})
                                                            setQuizResult(null)
                                                        }}
                                                        className="w-full rounded-lg border border-gray-200 bg-white p-3 text-left hover:bg-gray-50"
                                                    >
                                                        <p className="font-medium text-black">{quiz.title}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(quiz.created_at).toLocaleDateString()}
                                                        </p>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <button
                                            onClick={() => setCurrentQuiz(null)}
                                            className="text-sm text-gray-500 hover:text-black"
                                        >
                                            ← Back to list
                                        </button>
                                        <span className="text-sm font-medium text-black">{currentQuiz.title}</span>
                                    </div>

                                    {quizResult ? (
                                        <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
                                            <h3 className="mb-2 text-xl font-bold text-green-800">Score: {quizResult.score}%</h3>
                                            <p className="text-green-700">
                                                You got {quizResult.correct} out of {quizResult.total} correct!
                                            </p>
                                            <button
                                                onClick={() => {
                                                    setQuizAnswers({})
                                                    setQuizResult(null)
                                                }}
                                                className="mt-4 rounded-full bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700"
                                            >
                                                Try Again
                                            </button>
                                        </div>
                                    ) : null}

                                    <div className="space-y-6">
                                        {currentQuiz.questions.map((q: any, idx: number) => {
                                            const isCorrect = quizResult && quizAnswers[q.id] === q.answer
                                            const isWrong = quizResult && quizAnswers[q.id] !== q.answer && quizAnswers[q.id]

                                            return (
                                                <div key={q.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                                                    <p className="mb-3 font-medium text-black">
                                                        <span className="mr-2 text-gray-400">{idx + 1}.</span>
                                                        {q.question_text}
                                                    </p>
                                                    <div className="space-y-2">
                                                        {q.options.map((option: string) => (
                                                            <button
                                                                key={option}
                                                                onClick={() => !quizResult && setQuizAnswers({ ...quizAnswers, [q.id]: option })}
                                                                disabled={!!quizResult}
                                                                className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${quizResult
                                                                    ? option === q.answer
                                                                        ? 'bg-green-100 text-green-800 border border-green-200'
                                                                        : quizAnswers[q.id] === option
                                                                            ? 'bg-red-100 text-red-800 border border-red-200'
                                                                            : 'bg-gray-50 text-gray-500'
                                                                    : quizAnswers[q.id] === option
                                                                        ? 'bg-black text-white'
                                                                        : 'bg-gray-50 text-black hover:bg-gray-100'
                                                                    }`}
                                                            >
                                                                {option}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    {quizResult && (
                                                        <div className="mt-3 text-xs">
                                                            {isCorrect ? (
                                                                <span className="text-green-600 font-medium">Correct!</span>
                                                            ) : (
                                                                <span className="text-red-600 font-medium">
                                                                    Correct answer: {q.answer}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {!quizResult && (
                                        <button
                                            onClick={handleQuizSubmit}
                                            disabled={Object.keys(quizAnswers).length !== currentQuiz.questions.length}
                                            className="w-full rounded-full bg-black py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                                        >
                                            Submit Answers
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
