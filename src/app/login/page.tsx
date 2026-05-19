// src/app/login/page.tsx
import { login, signUp } from "../../lib/actions";

export default function LoginPage() {
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

        <div className="flex flex-col gap-2">
          <label
            htmlFor="email"
            className="text-sm font-semibold text-slate-300"
          >
            Correo Electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="tu@email.com"
            required
            className="rounded-lg bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="password"
            className="text-sm font-semibold text-slate-300"
          >
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            minLength={6}
            className="rounded-lg bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <button
            formAction={login}
            className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 p-3 font-semibold text-white transition-colors duration-200"
          >
            Iniciar Sesión
          </button>
          <button
            formAction={signUp}
            className="flex-1 rounded-lg bg-slate-700 hover:bg-slate-600 p-3 font-semibold text-white transition-colors duration-200 border border-slate-600"
          >
            Registrarse
          </button>
        </div>
      </form>
    </div>
  );
}
