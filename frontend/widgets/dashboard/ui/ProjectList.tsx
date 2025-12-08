'use client'

import { FolderNotchOpen, X, Plus, Clock } from 'phosphor-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Project {
    id: string
    title: string
    description?: string
    created_at: string
}

interface ProjectListProps {
    projects: Project[]
    onDelete: (id: string) => Promise<void>
    onCreateClick: () => void
}

export function ProjectList({ projects, onDelete, onCreateClick }: ProjectListProps) {
    const router = useRouter()
    const [hoveredProject, setHoveredProject] = useState<string | null>(null)

    if (projects.length === 0) {
        return (
            <div className="flex h-96 w-full flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/30 backdrop-blur-sm">
                <div className="mb-6 rounded-full bg-background p-6 shadow-sm ring-1 ring-border/50">
                    <FolderNotchOpen size={48} weight="light" className="text-muted-foreground" />
                </div>
                <h3 className="text-xl font-medium">No projects yet</h3>
                <p className="mt-2 text-muted-foreground max-w-xs text-center">Start by creating your first knowledge base to organize your documents.</p>
                <button
                    onClick={onCreateClick}
                    className="mt-8 text-sm font-medium text-primary hover:text-primary/80 hover:underline underline-offset-4"
                >
                    Create a project &rarr;
                </button>
            </div>
        )
    }

    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* New Project Card (Quick Action) */}
            <button
                onClick={onCreateClick}
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
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onDelete(project.id)
                                        }}
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
    )
}
