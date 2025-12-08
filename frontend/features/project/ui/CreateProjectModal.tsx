'use client'

import { useState } from 'react'
import { X } from 'phosphor-react'

interface CreateProjectModalProps {
    onClose: () => void
    onCreate: (title: string, description: string) => Promise<void>
}

export function CreateProjectModal({ onClose, onCreate }: CreateProjectModalProps) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (!title.trim()) return

        setIsSubmitting(true)
        try {
            await onCreate(title, description)
            setTitle('')
            setDescription('')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-2xl animate-fade-in-up">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">New Project</h2>
                    <button onClick={onClose} className="rounded-full p-2 hover:bg-secondary transition-colors">
                        <X size={20} className="text-muted-foreground" />
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-foreground">Project Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground/50"
                            placeholder="e.g. Advanced Physics Research"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-foreground">Description <span className="text-muted-foreground font-normal">(Optional)</span></label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground/50 min-h-[100px] resize-none"
                            placeholder="Briefly describe what this project is about..."
                        />
                    </div>
                </div>

                <div className="mt-8 flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-full border border-border bg-transparent px-6 py-3 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !title.trim()}
                        className="flex-1 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Creating...' : 'Create Project'}
                    </button>
                </div>
            </div>
        </div>
    )
}
