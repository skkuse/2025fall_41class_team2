'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { X, BookOpen, Translate } from 'phosphor-react'
import { getDocumentPages } from '@/shared/lib/api'

interface DocumentViewerModalProps {
    projectId: string
    docId: string
    initialPage?: number
    onClose?: () => void
    documentName?: string
}

export default function DocumentViewerModal({ projectId, docId, initialPage, onClose, documentName }: DocumentViewerModalProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [documentPages, setDocumentPages] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [targetPage, setTargetPage] = useState<number | null>(initialPage || null)
    const viewerContentRef = useRef<HTMLDivElement>(null)

    // If initialPage is not provided via props, try getting it from searchParams
    useEffect(() => {
        if (!initialPage) {
            const pageParam = searchParams.get('page')
            if (pageParam) {
                setTargetPage(parseInt(pageParam))
            }
        }
    }, [initialPage, searchParams])

    useEffect(() => {
        const loadPages = async () => {
            try {
                setLoading(true)
                const pages = await getDocumentPages(projectId, docId)
                setDocumentPages(pages)
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        if (projectId && docId) {
            loadPages()
        }
    }, [projectId, docId])

    // Scroll to target page when pages load
    useEffect(() => {
        if (targetPage && documentPages.length > 0) {
            // Small delay to ensure rendering
            setTimeout(() => {
                const pageElement = document.getElementById(`page-${targetPage}`)
                if (pageElement) {
                    pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
            }, 500)
        }
    }, [targetPage, documentPages])

    const handleClose = () => {
        if (onClose) {
            onClose()
        } else {
            router.back()
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="glass-panel flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/20">
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-white/10 px-8 py-5 bg-white/50 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <BookOpen size={20} weight="duotone" />
                        </div>
                        <div>
                            <h2 className="text-lg font-medium text-foreground">{documentName || 'Document Viewer'}</h2>
                            <p className="text-xs text-muted-foreground">Reading Mode</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="rounded-full p-2 text-muted-foreground transition-all hover:bg-red-50 hover:text-red-500 hover:rotate-90"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="flex flex-1 flex-col overflow-hidden bg-white/40">
                    {loading ? (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-4">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            <p className="text-sm font-medium text-muted-foreground">Loading document...</p>
                        </div>
                    ) : error ? (
                        <div className="flex h-full w-full items-center justify-center">
                            <div className="rounded-xl bg-red-50 p-6 text-center text-red-600">
                                <p className="font-medium">Error loading document</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-8 border-b border-white/10 bg-white/30 px-12 py-4 backdrop-blur-md">
                                <div className="flex items-center gap-2">
                                    <BookOpen size={16} className="text-muted-foreground" />
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Original Text</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Translate size={16} className="text-primary" />
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Korean Translation</h3>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 px-12 scroll-smooth" ref={viewerContentRef}>
                                <div className="space-y-4">
                                    {documentPages.length > 0 ? (
                                        documentPages.map((page) => (
                                            <div
                                                key={page.id}
                                                id={`page-${page.page_number}`}
                                                className={`grid grid-cols-2 gap-8 rounded-2xl border p-8 transition-all duration-500 ${targetPage === page.page_number
                                                    ? 'bg-yellow-50/50 border-yellow-200 shadow-md ring-1 ring-yellow-200'
                                                    : 'bg-white border-transparent shadow-sm hover:shadow-md hover:border-white/40'
                                                    }`}
                                            >
                                                <div className="relative">
                                                    <span className="absolute right-0 -bottom-6 font-mono text-xs font-medium text-muted-foreground/30">
                                                        P.{page.page_number}
                                                    </span>
                                                    <div className="prose prose-sm max-w-none text-foreground/90 prose-ul:list-disc prose-ol:list-decimal prose-li:marker:text-foreground/50">
                                                        <ReactMarkdown
                                                            remarkPlugins={[remarkGfm]}
                                                            components={{
                                                                h1: ({ node, ...props }) => <h3 className="text-sm font-bold mt-4 mb-2 uppercase tracking-wide" {...props} />,
                                                                h2: ({ node, ...props }) => <h3 className="text-sm font-bold mt-4 mb-2 uppercase tracking-wide" {...props} />,
                                                                h3: ({ node, ...props }) => <h3 className="text-sm font-bold mt-4 mb-2 uppercase tracking-wide" {...props} />,
                                                                ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
                                                                ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-4 space-y-1" {...props} />,
                                                                li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                                            }}
                                                        >
                                                            {page.original_text}
                                                        </ReactMarkdown>
                                                    </div>
                                                </div>

                                                <div className="relative">
                                                    <div className={`prose prose-sm max-w-none font-sans ${page.translated_text ? 'text-foreground' : 'text-muted-foreground italic'}`}>
                                                        {page.translated_text ? (
                                                            <ReactMarkdown
                                                                remarkPlugins={[remarkGfm]}
                                                                components={{
                                                                    h1: ({ node, ...props }) => <h3 className="text-sm font-bold mt-4 mb-2 uppercase tracking-wide" {...props} />,
                                                                    h2: ({ node, ...props }) => <h3 className="text-sm font-bold mt-4 mb-2 uppercase tracking-wide" {...props} />,
                                                                    h3: ({ node, ...props }) => <h3 className="text-sm font-bold mt-4 mb-2 uppercase tracking-wide" {...props} />,
                                                                    ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
                                                                    ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-4 space-y-1" {...props} />,
                                                                    li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                                                }}
                                                            >
                                                                {page.translated_text}
                                                            </ReactMarkdown>
                                                        ) : (
                                                            'Translation pending...'
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex h-64 items-center justify-center text-muted-foreground">
                                            No pages found.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
