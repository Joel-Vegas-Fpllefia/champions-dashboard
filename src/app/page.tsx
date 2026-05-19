// src/app/page.tsx
import { getDashboardMatches, getStandings, logout } from "../lib/actions";
import { createClient } from "../lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Validar usuario real
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Traer datos reales en paralelo
  const matches = await getDashboardMatches();
  const standings = await getStandings();

  // Traer equipo favorito real
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("favorite_team_id")
    .eq("id", user.id)
    .single();

  const favoriteTeamId = profile?.favorite_team_id;

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header Premium */}
      <header className="backdrop-blur-md bg-slate-900/40 border border-slate-800/60 rounded-2xl max-w-7xl mx-auto mb-10 p-5 flex justify-between items-center shadow-lg">
        <div>
          <h1 className="text-2xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-blue-400">
            CHAMPIONS<span className="text-blue-500 font-light">DASH</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono text-slate-300">{user.email}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/perfil"
            className="text-xs font-semibold uppercase tracking-wider bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl border border-slate-700/50 transition-all duration-300 shadow-sm"
          >
            Mi Perfil
          </Link>

          <form action={logout}>
            <button className="text-xs font-semibold uppercase tracking-wider bg-slate-800/80 hover:bg-red-950/40 hover:text-red-400 hover:border-red-900/50 text-slate-300 px-4 py-2.5 rounded-xl border border-slate-700/50 transition-all duration-300 shadow-sm">
              Cerrar Sesión
            </button>
          </form>
        </div>
      </header>

      {/* Contenido en Dos Columnas */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLUMNA 1 e 2: PARTIDOS (Ocupa 2 columnas de 3) */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
            <h2 className="text-lg font-bold uppercase tracking-widest text-slate-300">
              Partidos de la Jornada
            </h2>
          </div>

          {matches.length === 0 ? (
            <div className="text-center py-16 backdrop-blur-md bg-slate-900/20 rounded-2xl border border-slate-800/60">
              <p className="text-slate-400 font-medium">
                No hay partidos programados.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
              {matches.map((match) => {
                const isFavoriteMatch =
                  favoriteTeamId &&
                  (match.home_team_id === favoriteTeamId ||
                    match.away_team_id === favoriteTeamId);

                return (
                  <Link
                    href={`/matches/${match.id}`}
                    key={match.id}
                    className="block group"
                  >
                    <div
                      className={`backdrop-blur-md bg-slate-900/40 border rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden
                      ${
                        isFavoriteMatch
                          ? "border-blue-500 bg-blue-950/10 shadow-[0_0_30px_rgba(59,130,246,0.2)]"
                          : "border-slate-800/60 group-hover:border-slate-700 group-hover:shadow-[0_0_25px_rgba(59,130,246,0.15)]"
                      }`}
                    >
                      {isFavoriteMatch && (
                        <div className="absolute top-0 right-0 bg-blue-500 text-[8px] font-black uppercase tracking-widest text-white px-2.5 py-0.5 rounded-bl-xl">
                          Tu Equipo
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-3 my-2">
                        {/* Local */}
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-center p-2 shrink-0">
                            <img
                              src={match.home_team?.logo_url}
                              alt="logo"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <span className="font-bold text-sm tracking-tight truncate text-slate-200">
                            {match.home_team?.name}
                          </span>
                        </div>

                        {/* Marcador */}
                        <div className="flex items-center gap-2 bg-slate-950/90 px-3 py-1.5 rounded-xl border border-slate-800/80 font-mono text-base font-black text-blue-400">
                          <span>{match.home_score}</span>
                          <span className="text-slate-700">:</span>
                          <span>{match.away_score}</span>
                        </div>

                        {/* Visitante */}
                        <div className="flex items-center gap-2.5 flex-1 justify-end text-right min-w-0">
                          <span className="font-bold text-sm tracking-tight truncate text-slate-200">
                            + {match.away_team?.name}
                          </span>
                          <div className="w-10 h-10 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-center p-2 shrink-0">
                            <img
                              src={match.away_team?.logo_url}
                              alt="logo"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* COLUMNA 3: TABLA DE CLASIFICACIÓN (Ocupa 1 columna de 3) */}
        <div className="lg:col-span-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
            <h2 className="text-lg font-bold uppercase tracking-widest text-slate-300">
              Clasificación
            </h2>
          </div>

          <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800/60 rounded-3xl p-4 shadow-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] uppercase font-black tracking-wider text-slate-500 border-b border-slate-800/60 pb-2">
                  <th className="pb-3 pl-2 w-8">Pos</th>
                  <th className="pb-3">Club</th>
                  <th className="pb-3 text-center w-8">PJ</th>
                  <th className="pb-3 text-center w-8">GD</th>
                  <th className="pb-3 text-center w-10 text-emerald-400">
                    Pts
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-sm">
                {standings.map((team: any, index: number) => {
                  const isUserFavorite = team.id === favoriteTeamId;

                  return (
                    <tr
                      key={team.id}
                      className={`transition-colors duration-200 hover:bg-slate-800/30 
                        ${isUserFavorite ? "bg-blue-500/5 font-bold" : ""}`}
                    >
                      {/* Posición */}
                      <td className="py-3 pl-2 font-mono text-xs text-slate-400">
                        {index + 1}
                      </td>

                      {/* Nombre y Escudo */}
                      <td className="py-3 flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 bg-slate-950/40 p-1 rounded border border-slate-800 flex items-center justify-center shrink-0">
                          <img
                            src={team.logo_url}
                            alt="logo"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span
                          className={`truncate ${isUserFavorite ? "text-blue-400" : "text-slate-200"}`}
                        >
                          {team.name}
                        </span>
                      </td>

                      {/* Partidos Jugados */}
                      <td className="py-3 text-center font-mono text-xs text-slate-300">
                        {team.played}
                      </td>

                      {/* Diferencia de Goles */}
                      <td
                        className={`py-3 text-center font-mono text-xs ${team.gd > 0 ? "text-blue-400" : team.gd < 0 ? "text-red-400" : "text-slate-500"}`}
                      >
                        {team.gd > 0 ? `+${team.gd}` : team.gd}
                      </td>

                      {/* Puntos Totales */}
                      <td className="py-3 text-center font-mono font-black text-emerald-400">
                        {team.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
