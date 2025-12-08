'use client'

import { LoginForm } from '@/features/auth/ui/LoginForm'

export default function Home() {
  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-background font-sans antialiased text-foreground selection:bg-primary/20">

      {/* Abstract Background Animation */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] h-[50vh] w-[50vh] rounded-full bg-primary/20 blur-[120px] mix-blend-multiply animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[50vh] w-[50vh] rounded-full bg-secondary/30 blur-[120px] mix-blend-multiply animate-pulse delay-1000" />
      </div>

      <div className="flex w-full items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 lg:gap-24 items-center animate-fade-in-up">

          {/* Left Column: Brand & Messaging */}
          <div className="space-y-8 text-center lg:text-left">
            <div className="space-y-4">
              <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                Beta Access 2.0
              </span>
              <h1 className="text-5xl lg:text-7xl font-serif text-foreground leading-tight">
                Master your <br />
                <span className="text-gradient">Knowledge.</span>
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-md mx-auto lg:mx-0 font-light">
                Connect your documents, generate insights, and accelerate your learning with our intelligent LLM-powered assistant.
              </p>
            </div>

            <div className="hidden lg:flex gap-8 border-l-2 border-primary/20 pl-6">
              <div>
                <h3 className="text-3xl font-bold">10x</h3>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">Faster Analysis</p>
              </div>
              <div>
                <h3 className="text-3xl font-bold">24/7</h3>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">AI Assistant</p>
              </div>
            </div>
          </div>

          {/* Right Column: Login Card */}
          <LoginForm />

        </div>
      </div>
    </div>
  )
}
