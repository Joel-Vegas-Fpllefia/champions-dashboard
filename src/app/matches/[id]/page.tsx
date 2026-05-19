// src/app/matches/[id]/page.tsx
import { getMatchEvents } from "../../../lib/actions";
import { createClient } from "../../../lib/supabase/server";
import Link from "next/link";

// Forzamos a Next.js a no cachear esta página para ver los eventos en tiempo real
export const dynamic = "force-dynamic";

interface MatchPageProps {
  params: Promise<{ id: string }>;
}

export default async function MatchDetailPage({ params }: MatchPageProps) {
  const supabase = await createClient();

  // Desenvolvemos la promesa de params para obtener el id del partido
  const resolvedParams = await params;
  const matchId = resolvedParams.id;

  // 1. Obtener los detalles del partido actual con manejo de errores
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select(
      `
      *,
      home_team:teams!home_team_id(name, logo_url),
      away_team:teams!away_team_id(name, logo_url)
    `,
    )
    .eq("id", matchId)
    .single();

  // Si Supabase devuelve un error en la consulta, mostramos la tarjeta de error técnico
  if (matchError) {
    console.error(
      "🔴 Error de Supabase al buscar el partido:",
      matchError.message,
    );
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-red-900/40 p-6 rounded-2xl shadow-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-950/50 border border-red-800 flex items-center justify-center mx-auto text-red-400 font-bold text-xl">
            !
          </div>
          <h2 className="text-red-400 font-bold text-lg">
            Error de Base de Datos
          </h2>
          <p className="text-xs text-slate-400">
            Supabase no ha podido procesar la solicitud del partido:
          </p>
          <p className="text-xs font-mono bg-slate-950 p-3 rounded-lg border border-slate-800 text-left overflow-x-auto text-slate-300">
            {matchError.message}
          </p>
          <Link
            href="/"
            className="inline-block text-xs text-blue-400 hover:underline pt-2"
          >
            ← Volver al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // 2. Obtener los goles, asistencias y tarjetas de este partido
  const events = await getMatchEvents(matchId);

  if (!match) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex flex-col items-center justify-center p-4">
        <p className="text-sm font-semibold">
          El partido solicitado no existe en la base de datos.
        </p>
        <Link href="/" className="text-xs text-blue-400 mt-2 underline">
          Volver al Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl backdrop-blur-md bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 md:p-8 shadow-2xl space-y-8">
        {/* Botón de retroceso */}
        <Link
          href="/"
          className="inline-block text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest"
        >
          ← Volver al Dashboard
        </Link>

        {/* Marcador Principal */}
        <div className="flex items-center justify-between gap-4 py-4 border-b border-slate-800/60">
          {/* Equipo Local */}
          <div className="flex flex-col items-center flex-1 text-center min-w-0">
            <img
              src={match.home_team?.logo_url}
              className="w-16 h-16 object-contain mb-2"
              alt=""
            />
            <span className="font-bold text-sm md:text-base truncate w-full text-slate-200">
              {match.home_team?.name}
            </span>
          </div>

          {/* Goles */}
          <div className="bg-slate-950 px-6 py-3 rounded-2xl border border-slate-800/80 font-mono text-3xl font-black text-blue-400 tracking-tight shadow-inner">
            {match.home_score} : {match.away_score}
          </div>

          {/* Equipo Visitante */}
          <div className="flex flex-col items-center flex-1 text-center min-w-0">
            <img
              src={match.away_team?.logo_url}
              className="w-16 h-16 object-contain mb-2"
              alt=""
            />
            <span className="font-bold text-sm md:text-base truncate w-full text-slate-200">
              {match.away_team?.name}
            </span>
          </div>
        </div>

        {/* Línea de Tiempo / Cronología de Eventos */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 text-center">
            Incidencias del Encuentro
          </h3>

          {events.length === 0 ? (
            <p className="text-xs text-slate-600 text-center py-6 bg-slate-950/30 border border-slate-900 rounded-2xl">
              No se han registrado goles ni tarjetas en este partido todavía.
            </p>
          ) : (
            <div className="space-y-2.5">
              {events.map((event: any) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-slate-900 text-xs text-slate-200 hover:border-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Minuto del evento */}
                    <span className="font-mono font-bold text-blue-400 bg-slate-900 border border-slate-800 px-2 py-1 rounded">
                      {event.minute}′
                    </span>

                    {/* 👤 Foto real del jugador o fallback de DiceBear si no tiene avatar_url */}
                    <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center p-0.5 overflow-hidden flex-shrink-0">
                      <img
                        src={
                          event.players?.avatar_url ||
                          `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(event.players?.name || "player")}`
                        }
                        alt={event.players?.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>

                    <div>
                      {/* Nombre del futbolista */}
                      <p className="font-bold text-slate-200 text-sm">
                        {event.players?.name}
                      </p>
                      {/* Club al que pertenece */}
                      <p className="text-slate-500 text-[10px] uppercase tracking-wider font-medium">
                        {event.teams?.name}
                      </p>
                    </div>
                  </div>

                  {/* Badge visual según el tipo de acción */}
                  <span
                    className={`font-bold uppercase tracking-wider text-[10px] px-3 py-1 rounded-full border ${
                      event.type === "GOAL"
                        ? "bg-emerald-950/30 border-emerald-800 text-emerald-400"
                        : event.type === "ASSIST"
                          ? "bg-blue-950/30 border-blue-800 text-blue-400"
                          : event.type === "YELLOW_CARD"
                            ? "bg-amber-950/30 border-amber-800 text-amber-400"
                            : "bg-red-950/30 border-red-800 text-red-400"
                    }`}
                  >
                    {event.type === "GOAL" && "⚽ Gol"}
                    {event.type === "ASSIST" && "👟 Asistencia"}
                    {event.type === "YELLOW_CARD" && "🟨 Tarjeta Amarilla"}
                    {event.type === "RED_CARD" && "🟥 Tarjeta Roja"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
