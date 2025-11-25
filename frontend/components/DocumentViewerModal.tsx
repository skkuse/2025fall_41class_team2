'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { X } from 'phosphor-react'
import { getDocumentPages } from '../lib/api'

interface DocumentViewerModalProps {
    projectId: string
    docId: string
    initialPage?: number
    onClose?: () => void
    documentName?: string // Optional, might need to fetch if not provided
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
                    // We don't reset targetPage here immediately to keep it highlighted if needed, 
                    // but for scrolling once it's fine.
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h2 className="text-lg font-medium text-black">{documentName || 'Document Viewer'}</h2>
                    <button
                        onClick={handleClose}
                        className="rounded-full p-2 hover:bg-gray-100"
                    >
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="flex flex-1 overflow-hidden">
                    {loading ? (
                        <div className="flex h-full w-full items-center justify-center">
                            <p className="text-gray-500">Loading document...</p>
                        </div>
                    ) : error ? (
                        <div className="flex h-full w-full items-center justify-center">
                            <p className="text-red-500">{error}</p>
                        </div>
                    ) : (
                        <>
                            {/* Original Text Column */}
                            <div className="flex-1 overflow-y-auto border-r bg-gray-50 p-6" ref={viewerContentRef}>
                                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Original Text</h3>
                                <div className="space-y-6">
                                    {documentPages.length > 0 ? (
                                        documentPages.map((page) => (
                                            <div
                                                key={page.id}
                                                id={`page-${page.page_number}`}
                                                className={`rounded-lg p-6 shadow-sm transition-colors ${targetPage === page.page_number ? 'bg-yellow-50 ring-2 ring-yellow-400' : 'bg-white'
                                                    }`}
                                            >
                                                <div className="mb-2 text-xs font-medium text-gray-400">Page {page.page_number}</div>
                                                <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                                                    {page.original_text}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-gray-400">
                                            No pages found.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Translated Text Column */}
                            <div className="flex-1 overflow-y-auto bg-white p-6">
                                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-blue-600">Korean Translation</h3>
                                <div className="space-y-6">
                                    {documentPages.length > 0 ? (
                                        documentPages.map((page) => (
                                            <div key={page.id} className="rounded-lg border border-blue-100 bg-blue-50/30 p-6">
                                                <div className="mb-2 text-xs font-medium text-blue-400">Page {page.page_number}</div>
                                                <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                                                    {page.translated_text || (
                                                        <span className="italic text-gray-400">Translation pending...</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-gray-400">
                                            Loading translation...
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
