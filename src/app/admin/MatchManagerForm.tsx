// src/app/admin/MatchManagerForm.tsx
"use client";

import { useState } from "react";

interface MatchManagerFormProps {
  teams: any[];
  scheduledMatches: any[];
  createMatch: (formData: FormData) => Promise<void>;
  simulateMatch: (formData: FormData) => Promise<void>;
}

export function MatchManagerForm({
  teams,
  scheduledMatches,
  createMatch,
  simulateMatch,
}: MatchManagerFormProps) {
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6">
      {/* FORMULARIO: CREAR PARTIDO */}
      <form
        action={createMatch}
        className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-3"
      >
        <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">
          Organizar Nuevo Partido
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-slate-500 mb-0.5">
              Local
            </label>
            <select
              name="home_team_id"
              required
              className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg p-2 text-slate-200 focus:outline-none"
            >
              <option value="">-- Seleccionar --</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-0.5">
              Visitante
            </label>
            <select
              name="away_team_id"
              required
              className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg p-2 text-slate-200 focus:outline-none"
            >
              <option value="">-- Seleccionar --</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase py-2.5 rounded-lg transition-all"
        >
          Agendar Encuentro
        </button>
      </form>

      {/* SECCIÓN: SIMULAR PARTIDOS DISPONIBLES */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Partidos por Simular
        </p>

        {scheduledMatches.length === 0 ? (
          <p className="text-xs text-slate-600 italic text-center py-4 bg-slate-950/25 border border-slate-900 rounded-xl">
            No hay partidos pendientes. ¡Agenda uno arriba!
          </p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {scheduledMatches.map((m) => (
              <div
                key={m.id}
                className="p-3 bg-slate-950/50 border border-slate-800/60 rounded-xl flex items-center justify-between gap-3"
              >
                <span className="text-xs text-slate-300 font-medium truncate flex-1">
                  {m.home_team?.name} vs {m.away_team?.name}
                </span>

                <form
                  action={async (formData) => {
                    setLoading(true);
                    await simulateMatch(formData);
                    setLoading(false);
                  }}
                >
                  <input type="hidden" name="matchId" value={m.id} />
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                  >
                    {loading ? "Simulando..." : "⚡ Simular"}
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
