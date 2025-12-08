'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Plus, FolderNotchOpen, Clock, DotsThreeVertical } from 'phosphor-react'
import { getProjects, createProject, deleteProject } from '../../lib/api'
import { useAuth } from '../../components/AuthContext'

export default function Dashboard() {
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const [projects, setProjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showModal, setShowModal] = useState(false)
    const [newProject, setNewProject] = useState({ title: '', description: '' })
    const [hoveredProject, setHoveredProject] = useState<string | null>(null)

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

    const handleCreateProject = async () => {
        if (!newProject.title.trim()) return

        try {
            const created = await createProject(newProject.title, newProject.description)
            setProjects([created, ...projects])
            setShowModal(false)
            setNewProject({ title: '', description: '' })
        } catch (err: any) {
            setError(err.message)
        }
    }

    const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
        e.stopPropagation()

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

                {projects.length === 0 ? (
                    <div className="flex h-96 w-full flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/30 backdrop-blur-sm">
                        <div className="mb-6 rounded-full bg-background p-6 shadow-sm ring-1 ring-border/50">
                            <FolderNotchOpen size={48} weight="light" className="text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-medium">No projects yet</h3>
                        <p className="mt-2 text-muted-foreground max-w-xs text-center">Start by creating your first knowledge base to organize your documents.</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="mt-8 text-sm font-medium text-primary hover:text-primary/80 hover:underline underline-offset-4"
                        >
                            Create a project &rarr;
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {/* New Project Card (Quick Action) */}
                        <button
                            onClick={() => setShowModal(true)}
                            className="group relative flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/30 p-6 text-center transition-all hover:border-primary/50 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/5"
                        >
                            <div className="mb-4 rounded-full bg-background p-4 shadow-sm ring-1 ring-border/50 transition-transform group-hover:scale-110 group-hover:ring-primary/20">
                                <Plus size={24} className="text-muted-foreground group-hover:text-primary" />
                            </div>
                            <span className="font-medium text-foreground">Create New</span>
                        </button>

                        {projects.map((project, idx) => (
                            <div
                                key={project.id}
                                onClick={() => router.push(`/project/${project.id}`)}
                                onMouseEnter={() => setHoveredProject(project.id)}
                                onMouseLeave={() => setHoveredProject(null)}
                                className="group relative h-64 cursor-pointer overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5"
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                {/* Card Pattern Decoration */}
                                <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-2xl transition-transform duration-500 group-hover:scale-150" />

                                <div className="relative flex h-full flex-col justify-between">
                                    <div>
                                        <div className="mb-4 flex items-center justify-between">
                                            <div className="rounded-lg bg-secondary p-2 text-primary">
                                                <FolderNotchOpen size={20} weight="fill" />
                                            </div>
                                            {hoveredProject === project.id && (
                                                <button
                                                    onClick={(e) => handleDeleteProject(project.id, e)}
                                                    className="rounded-full p-2 text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
                                                    title="Delete project"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>
                                        <h3 className="line-clamp-2 text-xl font-medium leading-tight text-card-foreground group-hover:text-primary transition-colors">
                                            {project.title}
                                        </h3>
                                        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                                            {project.description || "No description provided."}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                        <Clock size={14} />
                                        <span>{new Date(project.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-2xl animate-fade-in-up">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-2xl font-semibold">New Project</h2>
                            <button onClick={() => setShowModal(false)} className="rounded-full p-2 hover:bg-secondary transition-colors">
                                <X size={20} className="text-muted-foreground" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-foreground">Project Title</label>
                                <input
                                    type="text"
                                    value={newProject.title}
                                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground/50"
                                    placeholder="e.g. Advanced Physics Research"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-foreground">Description <span className="text-muted-foreground font-normal">(Optional)</span></label>
                                <textarea
                                    value={newProject.description}
                                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground/50 min-h-[100px] resize-none"
                                    placeholder="Briefly describe what this project is about..."
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex gap-4">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 rounded-full border border-border bg-transparent px-6 py-3 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateProject}
                                className="flex-1 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
                            >
                                Create Project
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

