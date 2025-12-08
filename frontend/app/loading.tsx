export default function Loading() {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background gap-4">
            <div className="relative flex items-center justify-center">
                <div className="absolute h-16 w-16 animate-ping rounded-full bg-primary/20 opacity-75"></div>
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
            <p className="animate-pulse text-sm font-medium tracking-widest text-muted-foreground uppercase">
                Loading Workspace...
            </p>
        </div>
    )
}
