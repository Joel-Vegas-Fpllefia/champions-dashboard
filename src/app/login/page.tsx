"use client";

import { useActionState } from "react";
import { login, signUp } from "../../lib/actions";

type ActionState = { error?: string } | null;

export default function LoginPage() {
  const [loginState, loginAction, loginPending] = useActionState<ActionState, FormData>(
    async (_prev, formData) => login(formData),
    null
  );

  const [signUpState, signUpAction, signUpPending] = useActionState<ActionState, FormData>(
    async (_prev, formData) => signUp(formData),
    null
  );

  const isPending = loginPending || signUpPending;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <form className="flex w-full max-w-md flex-col gap-5 rounded-2xl bg-slate-900 p-8 shadow-2xl border border-slate-800 text-slate-200">
        <div className="text-center mb-2">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Champions<span className="text-blue-500">Dash</span>
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Inicia sesión o crea tu cuenta para empezar
          </p>
        </div>

        {/* 🔴 Mensaje de error — se muestra si login o registro fallan */}
        {(loginState?.error || signUpState?.error) && (
          <div className="flex items-center gap-3 rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            <span className="text-lg leading-none">⚠️</span>
            <span>{loginState?.error ?? signUpState?.error}</span>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-semibold text-slate-300">
            Correo Electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="tu@email.com"
            required
            disabled={isPending}
            className="rounded-lg bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-semibold text-slate-300">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            minLength={6}
            disabled={isPending}
            className="rounded-lg bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          {/* Botón Login — usa loginAction */}
          <button
            formAction={loginAction}
            disabled={isPending}
            className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 p-3 font-semibold text-white transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {loginPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Entrando...
              </>
            ) : (
              "Iniciar Sesión"
            )}
          </button>

          {/* Botón Registro — usa signUpAction */}
          <button
            formAction={signUpAction}
            disabled={isPending}
            className="flex-1 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-60 p-3 font-semibold text-white transition-colors duration-200 border border-slate-600 flex items-center justify-center gap-2"
          >
            {signUpPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Registrando...
              </>
            ) : (
              "Registrarse"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}