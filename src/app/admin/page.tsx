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
  createMatch,
  simulateMatch,
  changeUserRole,
} from "../../lib/actions";
import { createClient } from "../../lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MatchEventForm } from "./MatchEventForm";
import { EditTeamForm } from "./EditTeamForm";
import { EditPlayerForm } from "./EditPlayerForm";
import { MatchManagerForm } from "./MatchManagerForm";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: callerProfile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = callerProfile?.role ?? "user";
  if (role !== "admin" && role !== "editor") redirect("/");

  const isAdmin = role === "admin";

  const teams = await getTeams();
  const players = await getPlayers();
  const users = isAdmin ? await getUserProfiles() : [];

  const { data: allMatches } = await supabase
    .from("matches")
    .select(
      "id, home_score, away_score, status, home_team:teams!home_team_id(name), away_team:teams!away_team_id(name)",
    );

  const { data: scheduledMatches } = await supabase
    .from("matches")
    .select(
      "id, home_team:teams!home_team_id(name), away_team:teams!away_team_id(name)",
    )
    .not("status", "eq", "FINISHED");

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-950 text-slate-100">
      {/* HEADER */}
      <header className="backdrop-blur-md bg-slate-900/60 border border-purple-500/30 rounded-2xl max-w-7xl mx-auto mb-10 p-6 flex justify-between items-center shadow-xl">
        <div>
          <h1 className="text-2xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-500">
            UEFA <span className="font-light text-white">COMMAND CENTER</span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-slate-400">
              Conectado como{" "}
              <span className="font-mono text-slate-300">{user.email}</span>
            </p>
            <span
              className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                isAdmin
                  ? "bg-amber-950/40 border-amber-700 text-amber-400"
                  : "bg-blue-950/40 border-blue-700 text-blue-400"
              }`}
            >
              {isAdmin ? "Admin" : "Editor"}
            </span>
          </div>
        </div>
        <Link
          href="/"
          className="text-xs font-bold uppercase tracking-widest bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 px-4 py-2.5 rounded-xl transition-all"
        >
          ← Volver al Dashboard
        </Link>
      </header>

      {/* PANEL */}
      <main
        className={`max-w-7xl mx-auto grid grid-cols-1 gap-8 ${
          isAdmin ? "lg:grid-cols-3" : "lg:grid-cols-2"
        }`}
      >
        {/* COLUMNA 1 */}
        <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-pink-500 rounded-full"></div>
              <h2 className="text-base font-bold uppercase tracking-wider text-slate-300">
                Clubes y Competición
              </h2>
            </div>
            <EditTeamForm
              teams={teams}
              createTeam={createTeam}
              updateTeam={updateTeam}
            />
            <hr className="border-slate-800/50" />
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
                    src={team.logo_url ?? undefined}
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

        {/* COLUMNA 2 */}
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
            <EditPlayerForm players={players || []} updatePlayer={updatePlayer} />
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

        {/* COLUMNA 3: SOLO ADMIN */}
        {isAdmin && (
          <div className="backdrop-blur-md bg-slate-900/40 border border-amber-500/20 rounded-3xl p-6 space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-amber-500 rounded-full"></div>
              <h2 className="text-base font-bold uppercase tracking-wider text-slate-300">
                Gestión de Usuarios
              </h2>
              <span className="text-[10px] bg-amber-950/40 border border-amber-800 text-amber-400 px-2 py-0.5 rounded-full font-bold uppercase">
                Solo Admin
              </span>
            </div>

            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
              {(users as any[]).map((profile: any) => (
                <div
                  key={profile.id}
                  className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-3"
                >
                  <div>
                    <p className="text-[10px] font-mono text-slate-500 truncate">
                      {profile.id}
                    </p>
                    <p className="text-xs text-slate-300 font-semibold mt-0.5">
                      Club:{" "}
                      <span className="text-blue-400">
                        {profile.teams?.name || "Ninguno"}
                      </span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Rol actual:{" "}
                      <span
                        className={`font-bold ${
                          profile.role === "admin"
                            ? "text-amber-400"
                            : profile.role === "editor"
                              ? "text-blue-400"
                              : "text-slate-400"
                        }`}
                      >
                        {profile.role ?? "user"}
                      </span>
                    </p>
                  </div>

                  {/*
                   * 🔴 BUG FIX: Los dos forms estaban ANIDADOS (form dentro de form).
                   * HTML ignora el form interior, así que "Banear" disparaba changeUserRole
                   * y "Cambiar" tampoco funcionaba correctamente.
                   * Solución: usar un div como contenedor y poner los dos forms en paralelo.
                   */}
                  <div className="flex gap-2 items-center">
                    {/* Form 1: Cambiar rol */}
                    <form action={changeUserRole} className="flex gap-2 items-center flex-1">
                      <input type="hidden" name="userId" value={profile.id} />
                      <select
                        name="role"
                        defaultValue={profile.role ?? "user"}
                        className="flex-1 bg-slate-900 border border-slate-700 text-xs rounded-lg p-1.5 text-slate-200 focus:outline-none"
                      >
                        <option value="user">user</option>
                        <option value="editor">editor</option>
                        <option value="admin">admin</option>
                      </select>
                      <button
                        type="submit"
                        className="bg-blue-700 hover:bg-blue-600 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition-all"
                      >
                        Cambiar
                      </button>
                    </form>

                    {/* Form 2: Banear — ahora es un form hermano, NO hijo del anterior */}
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
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}