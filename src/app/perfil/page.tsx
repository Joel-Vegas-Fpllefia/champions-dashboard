// src/app/perfil/page.tsx
import { getTeams, updateFavoriteTeam } from "../../lib/actions";
import { createClient } from "../../lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function PerfilPage() {
  const supabase = await createClient();

  // 1. Validamos al usuario real. Si no hay sesión, al login.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. Traemos los equipos reales de Supabase
  const teams = await getTeams();

  // 3. Consultamos el equipo favorito real guardado en la base de datos
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("favorite_team_id")
    .eq("id", user.id)
    .single();

  const currentFavorite = profile?.favorite_team_id;

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-3xl">
        {/* Volver */}
        <Link
          href="/"
          className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-blue-400 mb-6 inline-flex items-center gap-2 transition-colors"
        >
          ← Volver al Dashboard
        </Link>

        {/* Cabecera */}
        <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 mb-6">
          <h2 className="text-xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
            CONFIGURA TU PERFIL
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Selecciona tu club favorito para personalizar las alertas de la
            jornada.
          </p>
        </div>

        {/* Grid de Selección */}
        <form
          action={updateFavoriteTeam}
          className="grid grid-cols-2 sm:grid-cols-3 gap-4"
        >
          {teams.map((team) => {
            const isSelected = currentFavorite === team.id;
            return (
              <button
                key={team.id}
                type="submit"
                name="teamId"
                value={team.id}
                className={`backdrop-blur-md p-5 rounded-2xl border text-center flex flex-col items-center gap-3 transition-all duration-300 cursor-pointer relative overflow-hidden group w-full
                  ${
                    isSelected
                      ? "bg-blue-600/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.25)]"
                      : "bg-slate-900/40 border-slate-800/60 hover:border-blue-500/40 hover:bg-slate-900/60"
                  }`}
              >
                {isSelected && (
                  <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                )}

                <div className="w-16 h-16 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                  <img
                    src={team.logo_url}
                    alt={team.name}
                    className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
                  />
                </div>

                <div className="flex flex-col items-center">
                  <span className="font-bold text-sm tracking-tight text-slate-200 group-hover:text-white transition-colors">
                    {team.name}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    Míster: {team.coach_name.split(" ").pop()}
                  </span>
                </div>
              </button>
            );
          })}
        </form>
      </div>
    </div>
  );
}
