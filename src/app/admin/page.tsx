// src/app/admin/page.tsx
import {
  getTeams,
  getPlayers,
  transferPlayer,
  createTeam,
  deleteTeam,
  getUserProfiles,
  deleteUserProfile,
  createMatchEvent,
  updateTeam,
  updatePlayer,
  createMatch, // Nueva acción
  simulateMatch, // Nueva acción
} from "../../lib/actions";
import { createClient } from "../../lib/supabase/server";
import Link from "next/link";
import { MatchEventForm } from "./MatchEventForm";
import { EditTeamForm } from "./EditTeamForm";
import { EditPlayerForm } from "./EditPlayerForm";
import { MatchManagerForm } from "./MatchManagerForm"; // Nuevo Import

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();

  const teams = await getTeams();
  const players = await getPlayers();
  const users = await getUserProfiles();

  // Traemos los partidos jugados o listos para añadir actas manuales
  const { data: allMatches } = await supabase
    .from("matches")
    .select(
      "id, home_score, away_score, home_team:teams!home_team_id(name), away_team:teams!away_team_id(name)",
    );

  // Traemos por separado únicamente los partidos agendados que no se han jugado (para simular)
  const { data: scheduledMatches } = await supabase
    .from("matches")
    .select(
      "id, home_team:teams!home_team_id(name), away_team:teams!away_team_id(name)",
    )
    .not("status", "eq", "FINISHED"); // Suponiendo que filtras por estatus o marcadores a 0

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-950 text-slate-100">
      {/* HEADER */}
      <header className="backdrop-blur-md bg-slate-900/60 border border-purple-500/30 rounded-2xl max-w-7xl mx-auto mb-10 p-6 flex justify-between items-center shadow-xl">
        <div>
          <h1 className="text-2xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-500">
            UEFA <span className="font-light text-white">COMMAND CENTER</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Simulador de Partidos, Traspasos e Incidencias en Tiempo Real
          </p>
        </div>
        <Link
          href="/"
          className="text-xs font-bold uppercase tracking-widest bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 px-4 py-2.5 rounded-xl transition-all"
        >
          ← Volver al Dashboard
        </Link>
      </header>

      {/* PANEL DE TRES COLUMNAS */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLUMNA 1: OPERACIONES DE CLUBES Y PARTIDOS */}
        <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-pink-500 rounded-full"></div>
              <h2 className="text-base font-bold uppercase tracking-wider text-slate-300">
                Clubes y Competición
              </h2>
            </div>

            {/* Gestión e Identidad de Equipos */}
            <EditTeamForm
              teams={teams}
              createTeam={createTeam}
              updateTeam={updateTeam}
            />

            <hr className="border-slate-800/50" />

            {/* LÓGICA DE SIMULADOR DE PARTIDOS */}
            <MatchManagerForm
              teams={teams}
              scheduledMatches={scheduledMatches || []}
              createMatch={createMatch}
              simulateMatch={simulateMatch}
            />
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto pr-1 mt-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Clubes en el Sistema
            </p>
            {teams.map((team) => (
              <div
                key={team.id}
                className="flex items-center justify-between p-2 bg-slate-950/40 border border-slate-800/50 rounded-xl text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <img
                    src={team.logo_url}
                    className="w-4 h-4 object-contain flex-shrink-0"
                    alt=""
                  />
                  <span className="truncate font-medium text-slate-300">
                    {team.name}
                  </span>
                </div>
                <form action={deleteTeam}>
                  <input type="hidden" name="id" value={team.id} />
                  <button
                    type="submit"
                    className="text-red-400 hover:text-red-500 font-medium px-2 py-0.5"
                  >
                    Eliminar
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMNA 2: MERCADO, EDICIÓN DE JUGADORES Y ACTAS MANUALES */}
        <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-purple-500 rounded-full"></div>
              <h2 className="text-base font-bold uppercase tracking-wider text-slate-300">
                Mercado de Fichajes
              </h2>
            </div>
            <form
              action={transferPlayer}
              className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60"
            >
              <select
                name="playerId"
                required
                className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg p-2.5 text-slate-200 focus:outline-none"
              >
                <option value="">-- Seleccionar jugador --</option>
                {players.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.teams?.name || "Agente Libre"})
                  </option>
                ))}
              </select>
              <select
                name="newTeamId"
                required
                className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg p-2.5 text-slate-200 focus:outline-none"
              >
                <option value="">-- Seleccionar destino --</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 font-bold text-xs uppercase py-2.5 rounded-lg tracking-widest"
              >
                Ejecutar Traspaso
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Personalizar Jugadores
              </h2>
            </div>
            <EditPlayerForm
              players={players || []}
              updatePlayer={updatePlayer}
            />
          </div>

          <hr className="border-slate-800/50" />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-yellow-500 rounded-full"></div>
              <h2 className="text-base font-bold uppercase tracking-wider text-slate-300">
                Acta Manual
              </h2>
            </div>
            <MatchEventForm
              matches={allMatches || []}
              players={players || []}
              createMatchEvent={createMatchEvent}
            />
          </div>
        </div>

        {/* COLUMNA 3: CONTROL DE USUARIOS */}
        <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-300">
              Control de Usuarios
            </h2>
          </div>
          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {users.map((profile: any) => (
              <div
                key={profile.id}
                className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-mono text-slate-500 truncate">
                    UUID: {profile.id}
                  </p>
                  <p className="text-xs text-slate-300 font-semibold mt-0.5 truncate">
                    Club Favorito:{" "}
                    <span className="text-blue-400 font-bold">
                      {profile.teams?.name || "Ninguno"}
                    </span>
                  </p>
                </div>
                <form action={deleteUserProfile}>
                  <input type="hidden" name="id" value={profile.id} />
                  <button
                    type="submit"
                    className="bg-red-950/40 hover:bg-red-900/40 border border-red-900/30 text-red-400 text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg transition-all"
                  >
                    Banear
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
