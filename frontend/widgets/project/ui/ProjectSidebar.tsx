'use client'

import React, { useRef } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { CaretLeft, FilePdf, Plus, Trash } from 'phosphor-react'
import { uploadDocument, deleteDocument } from '@/shared/lib/api'

interface Document {
    id: string
    name: string
    status: string
    created_at: string
    processing_message?: string
}

interface ProjectSidebarProps {
    projectId: string
    documents: Document[]
    setDocuments: React.Dispatch<React.SetStateAction<any[]>>
    setError: (err: string) => void
}

export function ProjectSidebar({ projectId, documents, setDocuments, setError }: ProjectSidebarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)

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

    const handleDeleteDocument = async (documentId: string) => {
        if (!projectId) return

        try {
            await deleteDocument(projectId, documentId)
            setDocuments(documents.filter(doc => doc.id !== documentId))
        } catch (err: any) {
            setError(err.message)
        }
    }

    return (
        <aside className="flex w-[430px] flex-col border-r border-sidebar-border bg-sidebar/50 backdrop-blur-xl h-full">
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
                        <div key={doc.id} className="group relative flex flex-col gap-1 rounded-lg px-3 py-2.5 transition-all hover:bg-sidebar-accent">
                            <div className="flex items-center gap-3">
                                <Link
                                    href={`/project/${projectId}/document/${doc.id}`}
                                    className="flex flex-1 items-center gap-3 min-w-0"
                                >
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white shadow-sm ring-1 ring-black/5">
                                        {doc.status === 'processing' ? (
                                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                        ) : (
                                            <FilePdf size={16} className="text-red-500" weight="fill" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-sidebar-foreground group-hover:text-primary">{doc.name}</p>
                                        <div className="flex items-center justify-between">
                                            <p className="truncate text-xs text-muted-foreground">
                                                {doc.status === 'processing' ? (doc.processing_message || 'Processing...') : new Date(doc.created_at || Date.now()).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </Link>

                                <button
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        handleDeleteDocument(doc.id)
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-all z-10"
                                >
                                    <Trash size={14} />
                                </button>
                            </div>

                            {/* Progress Bar */}
                            {doc.status === 'processing' && (
                                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-sidebar-border/50">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-primary to-purple-500"
                                        initial={{ width: 0 }}
                                        animate={{
                                            width: (() => {
                                                const msg = doc.processing_message || '';
                                                if (msg.includes('Starting')) return '5%';
                                                if (msg.includes('Loading')) return '10%';
                                                if (msg.includes('Processing & Translating')) {
                                                    const match = msg.match(/page (\d+) of (\d+)/);
                                                    if (match) {
                                                        const [_, current, total] = match;
                                                        const percentage = 10 + (80 * parseInt(current) / parseInt(total));
                                                        return `${percentage}%`;
                                                    }
                                                    return '15%';
                                                }
                                                if (msg.includes('Indexing')) return '90%';
                                                if (msg.includes('Completed')) return '100%';
                                                return '50%'; // Indeterminate state fallback
                                            })()
                                        }}
                                        transition={{ duration: 0.5, ease: "easeInOut" }}
                                    />
                                </div>
                            )}
                        </div>
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
    )
}
