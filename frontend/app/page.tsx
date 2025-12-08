'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { ArrowRight, GoogleLogo, GithubLogo, ChatCircleDots } from 'phosphor-react' // Assuming phosphor-react is available, otherwise use SVGs

export default function Home() {
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleOAuthLogin = async (provider: 'google' | 'github' | 'kakao') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
    if (error) setError(error.message)
  }

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
          <div className="w-full max-w-md mx-auto">
            <div className="glass-panel rounded-2xl p-8 lg:p-10 relative overflow-hidden group">
              {/* Decorative Gradient Line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-primary/0" />

              <div className="mb-8 text-center">
                <h2 className="text-2xl font-semibold">Welcome Back</h2>
                <p className="text-sm text-muted-foreground mt-2">Sign in to access your workspace</p>
              </div>

              {error && (
                <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-center text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <button
                  onClick={() => handleOAuthLogin('google')}
                  className="relative flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-white/50 px-4 py-3.5 text-sm font-medium transition-all hover:bg-white hover:border-gray-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                >
                  <GoogleLogo className="h-5 w-5 text-gray-700" weight="bold" /> {/* Defaulting to GoogleLogo from phosphor if available, else SVG below */}
                  <span>Continue with Google</span>
                </button>

                <button
                  onClick={() => handleOAuthLogin('github')}
                  className="relative flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-white/50 px-4 py-3.5 text-sm font-medium transition-all hover:bg-white hover:border-gray-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                >
                  <GithubLogo className="h-5 w-5 text-gray-900" weight="fill" />
                  <span>Continue with GitHub</span>
                </button>

                <button
                  onClick={() => handleOAuthLogin('kakao')}
                  className="relative flex w-full items-center justify-center gap-3 rounded-xl border border-yellow-300 bg-[#FEE500]/90 px-4 py-3.5 text-sm font-medium text-black transition-all hover:bg-[#FEE500] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                >
                  <ChatCircleDots className="h-5 w-5" weight="fill" />
                  <span>Continue with Kakao</span>
                </button>
              </div>

              <div className="mt-8 text-center">
                <p className="text-xs text-muted-foreground">
                  By continuing, you agree to our <a href="#" className="underline hover:text-primary">Terms of Service</a> and <a href="#" className="underline hover:text-primary">Privacy Policy</a>.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

