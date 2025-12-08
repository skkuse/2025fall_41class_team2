'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'phosphor-react'
import { getProjects, createProject, deleteProject } from '@/shared/lib/api'
import { useAuth } from '@/features/auth/model/AuthContext'
import { ProjectList } from '@/widgets/dashboard/ui/ProjectList'
import { CreateProjectModal } from '@/features/project/ui/CreateProjectModal'

export default function Dashboard() {
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const [projects, setProjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showModal, setShowModal] = useState(false)

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/')
            return
        }

        if (user) {
            loadProjects()
        }
    }, [user, authLoading, router])

    const loadProjects = async () => {
        try {
            setLoading(true)
            const data = await getProjects()
            setProjects(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateProject = async (title: string, description: string) => {
        try {
            const created = await createProject(title, description)
            setProjects([created, ...projects])
            setShowModal(false)
        } catch (err: any) {
            setError(err.message)
            // Re-throw so modal knows it failed? Or handle here.
            // Modal component handles its own state, but we need to propagate error?
            // For now, setting page error is okay.
        }
    }

    const handleDeleteProject = async (projectId: string) => {
        try {
            await deleteProject(projectId)
            setProjects(projects.filter(p => p.id !== projectId))
        } catch (err: any) {
            setError(err.message)
        }
    }

    if (authLoading || loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background p-6 lg:p-12 font-sans text-foreground transition-colors duration-500">
            {/* Background Blob */}
            <div className="fixed top-0 right-0 -z-10 h-[50vh] w-[50vh] rounded-full bg-primary/5 blur-[100px]" />

            <div className="mx-auto max-w-7xl animate-fade-in-up">
                <header className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            <span className="h-1 w-8 rounded-full bg-primary"></span>
                            Workspace
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-serif text-foreground">
                            Hello, <span className="text-gradient font-medium">{user?.user_metadata?.name || user?.email?.split('@')[0]}</span>
                        </h1>
                    </div>

                    <button
                        onClick={() => setShowModal(true)}
                        className="group flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-all hover:bg-primary hover:shadow-lg hover:shadow-primary/25 active:scale-95"
                    >
                        <Plus size={18} weight="bold" />
                        <span>New Project</span>
                    </button>
                </header>

                {error && (
                    <div className="mb-8 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-600 backdrop-blur-sm">
                        {error}
                    </div>
                )}

                <ProjectList
                    projects={projects}
                    onDelete={handleDeleteProject}
                    onCreateClick={() => setShowModal(true)}
                />
            </div>

            {/* Modal */}
            {showModal && (
                <CreateProjectModal
                    onClose={() => setShowModal(false)}
                    onCreate={handleCreateProject}
                />
            )}
        </div>
    )
}
