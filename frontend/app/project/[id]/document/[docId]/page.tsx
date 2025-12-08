'use client'

import { useEffect, useState } from 'react'
import DocumentViewerModal from '../../../../../components/DocumentViewerModal'
import { getDocuments } from '../../../../../lib/api'
import { useRouter } from 'next/navigation'

export default function DocumentPage({ params, searchParams }: { params: Promise<{ id: string, docId: string }>, searchParams: Promise<{ page?: string }> }) {
    const router = useRouter()
    const [projectId, setProjectId] = useState<string | null>(null)
    const [docId, setDocId] = useState<string | null>(null)
    const [page, setPage] = useState<number | undefined>(undefined)
    const [docName, setDocName] = useState<string | undefined>(undefined)

    useEffect(() => {
        const unwrapParams = async () => {
            const p = await params
            const sp = await searchParams
            setProjectId(p.id)
            setDocId(p.docId)
            if (sp.page) {
                setPage(parseInt(sp.page))
            }
        }
        unwrapParams()
    }, [params, searchParams])

    // Fetch document name for the header
    useEffect(() => {
        const fetchDocName = async () => {
            if (projectId && docId) {
                try {
                    const docs = await getDocuments(projectId)
                    const doc = docs.find((d: any) => d.id === docId)
                    if (doc) {
                        setDocName(doc.name)
                    }
                } catch (e) {
                    console.error("Failed to fetch document name", e)
                }
            }
        }
        fetchDocName()
    }, [projectId, docId])

    if (!projectId || !docId) return null

    return (
        <div className="min-h-screen w-full bg-background">
            <DocumentViewerModal
                projectId={projectId}
                docId={docId}
                initialPage={page}
                documentName={docName}
                onClose={() => router.push(`/project/${projectId}`)}
            />
        </div>
    )
}
