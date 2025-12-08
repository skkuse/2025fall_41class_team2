'use client'

import { useState } from 'react'
import { supabase } from '@/shared/lib/supabaseClient'
import { GoogleLogo, GithubLogo, ChatCircleDots } from 'phosphor-react'

export function LoginForm() {
    const [error, setError] = useState<string | null>(null)

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
        <div className="glass-panel rounded-2xl p-8 lg:p-10 relative overflow-hidden group w-full max-w-md mx-auto">
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
                    <GoogleLogo className="h-5 w-5 text-gray-700" weight="bold" />
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
    )
}
