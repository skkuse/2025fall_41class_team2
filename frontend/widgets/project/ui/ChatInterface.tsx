'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Sparkle, PaperPlaneRight, FilePdf, Pencil, Check, X as XIcon } from 'phosphor-react'
import SuggestedQuestions from '@/features/chat/ui/SuggestedQuestions'
import { sendMessage, updateProject, getSuggestedQuestions } from '@/shared/lib/api'

interface Message {
    role: string
    content: string
    created_at?: string
    sources?: any
}

interface ChatInterfaceProps {
    projectId: string
    projectTitle: string
    messages: Message[]
    setMessages: React.Dispatch<React.SetStateAction<any[]>>
    setError: (err: string) => void
    onUpdateTitle: (newTitle: string) => void
}

export function ChatInterface({ projectId, projectTitle, messages, setMessages, setError, onUpdateTitle }: ChatInterfaceProps) {
    const [newMessage, setNewMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([])
    const [loadingSuggestions, setLoadingSuggestions] = useState(false)
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [editedTitle, setEditedTitle] = useState(projectTitle)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (projectId) {
            loadSuggestedQuestions()
        }
    }, [projectId])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

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

    const handleSaveTitle = async () => {
        if (!projectId || !editedTitle.trim()) return

        try {
            await updateProject(projectId, editedTitle)
            onUpdateTitle(editedTitle)
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

    const preprocessMessageContent = (content: string) => {
        return content.replace(
            /\[Document ID: ([a-zA-Z0-9-]+), Page: ([\d-]+)\]/g,
            (match, docId, pageNum) => `[${pageNum}p](/project/${projectId}/document/${docId}?page=${pageNum})`
        )
    }

    return (
        <main className="flex flex-1 flex-col relative bg-white/50 h-full">
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
                            <button onClick={() => setIsEditingTitle(false)} className="rounded-full p-1 hover:bg-red-50 text-red-500"><XIcon size={16} /></button>
                        </div>
                    ) : (
                        <div className="group flex items-center gap-2 cursor-pointer" onClick={() => { setEditedTitle(projectTitle); setIsEditingTitle(true); }}>
                            <h1 className="text-lg font-medium text-foreground">{projectTitle}</h1>
                            <Pencil size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                        </div>
                    )}
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
    )
}
