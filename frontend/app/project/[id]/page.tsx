'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getProject, getDocuments, getMessages } from '@/shared/lib/api'
import { useAuth } from '@/features/auth/model/AuthContext'
import { ProjectSidebar } from '@/widgets/project/ui/ProjectSidebar'
import { ChatInterface } from '@/widgets/project/ui/ChatInterface'
import { ToolsPanel } from '@/widgets/project/ui/ToolsPanel'
import { Loading } from '@/shared/ui/loading'

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const [projectId, setProjectId] = useState<string | null>(null)
    const [project, setProject] = useState<any>(null)
    const [documents, setDocuments] = useState<any[]>([])
    const [messages, setMessages] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

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

    const loadProjectData = async () => {
        if (!projectId) return
        try {
            setLoading(true)
            const minLoadTime = new Promise(resolve => setTimeout(resolve, 1000))
            const [projectData, docsData, msgsData] = await Promise.all([
                getProject(projectId),
                getDocuments(projectId),
                getMessages(projectId),
                minLoadTime
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
        }, 1000)

        return () => clearInterval(interval)
    }, [documents, projectId])


    if (authLoading || loading) {
        return <Loading />
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
            <ProjectSidebar
                projectId={projectId!}
                documents={documents}
                setDocuments={setDocuments}
                setError={setError}
            />

            {/* Main Content - Chat */}
            <ChatInterface
                projectId={projectId!}
                projectTitle={project.title}
                messages={messages}
                setMessages={setMessages}
                setError={setError}
                onUpdateTitle={(newTitle) => setProject({ ...project, title: newTitle })}
            />

            {/* Right Sidebar - Tools */}
            <ToolsPanel
                projectId={projectId!}
                documentsCount={documents.length}
                setError={setError}
            />
        </div>
    )
}
