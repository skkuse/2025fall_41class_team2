'use client'
import Link from 'next/link'
import { CaretLeft } from 'phosphor-react'

export default function NotFound() {
    return (
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background p-4 text-center">
            {/* Background Blobs */}
            <div className="absolute top-[-20%] left-[-10%] h-[50vh] w-[50vh] rounded-full bg-primary/20 blur-[120px] mix-blend-multiply animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] h-[50vh] w-[50vh] rounded-full bg-purple-500/20 blur-[120px] mix-blend-multiply animate-pulse delay-1000" />

            <div className="glass-panel relative flex max-w-md flex-col items-center rounded-3xl p-12 shadow-2xl animate-fade-in-up">
                <h1 className="mb-2 text-9xl font-black text-foreground/10">404</h1>
                <h2 className="mb-4 text-2xl font-bold text-foreground">Page Not Found</h2>
                <p className="mb-8 text-muted-foreground">
                    The page you are looking for doesn't exist or has been moved.
                </p>

                <Link
                    href="/dashboard"
                    className="group flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105 hover:shadow-lg hover:shadow-primary/25 active:scale-95"
                >
                    <CaretLeft size={16} weight="bold" />
                    <span>Back to Dashboard</span>
                </Link>
            </div>
        </div>
    )
}
