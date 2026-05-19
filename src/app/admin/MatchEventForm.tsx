// src/app/admin/MatchEventForm.tsx
"use client";

import { useState } from "react";

interface MatchEventFormProps {
  matches: any[];
  players: any[];
  createMatchEvent: (formData: FormData) => Promise<void>;
}

export function MatchEventForm({
  matches,
  players,
  createMatchEvent,
}: MatchEventFormProps) {
  const [selectedMatchId, setSelectedMatchId] = useState("");

  // 1. Buscamos el partido seleccionado actualmente para saber qué equipos juegan
  const currentMatch = matches.find((m) => m.id === selectedMatchId);

  // 2. 🌟 FILTRADO INTELIGENTE: Si hay un partido elegido, solo dejamos pasar a los jugadores
  // cuyo team_id coincida con el equipo local o visitante de ese partido específico.
  const filteredPlayers = currentMatch
    ? players.filter(
        (p) =>
          p.team_id === currentMatch.home_team_id ||
          p.team_id === currentMatch.away_team_id,
      )
    : [];

  return (
    <form
      action={createMatchEvent}
      className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60"
    >
      {/* Selector de Encuentros */}
      <div>
        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
          Encuentro
        </label>
        <select
          name="matchId"
          required
          value={selectedMatchId}
          onChange={(e) => setSelectedMatchId(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-yellow-500"
        >
          <option value="">-- Selecciona el partido --</option>
          {matches.map((m) => (
            <option key={m.id} value={m.id}>
              {m.home_team?.name} ({m.home_score}) vs {m.away_team?.name} (
              {m.away_score})
            </option>
          ))}
        </select>
      </div>

      {/* Selector de Jugadores Filtrado */}
      <div>
        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
          Jugador Implicado
        </label>
        <select
          name="playerId"
          required
          disabled={!selectedMatchId}
          className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {!selectedMatchId ? (
            <option value="">-- Elige primero un partido --</option>
          ) : filteredPlayers.length === 0 ? (
            <option value="">No hay jugadores cargados en estos equipos</option>
          ) : (
            <>
              <option value="">-- Selecciona al jugador --</option>
              {filteredPlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.teams?.name})
                </option>
              ))}
            </>
          )}
        </select>
      </div>

      {/* Tipo e Incidencia */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
            Incidencia
          </label>
          <select
            name="type"
            required
            className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-yellow-500"
          >
            <option value="GOAL">⚽ Gol</option>
            <option value="ASSIST">👟 Asistencia</option>
            <option value="YELLOW_CARD">🟨 Tarjeta Amarilla</option>
            <option value="RED_CARD">🟥 Tarjeta Roja</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
            Minuto
          </label>
          <input
            type="number"
            name="minute"
            min="1"
            max="120"
            placeholder="Ej: 23"
            required
            className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-yellow-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!selectedMatchId}
        className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-xs uppercase py-2.5 rounded-lg transition-all shadow-md disabled:opacity-40"
      >
        Registrar Evento
      </button>
    </form>
  );
}
