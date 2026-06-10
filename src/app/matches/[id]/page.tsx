// src/app/matches/[id]/page.tsx
import { getMatchEvents, getComments, addComment, deleteComment } from "../../../lib/actions";
import { createClient } from "../../../lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface MatchPageProps {
  params: Promise<{ id: string }>;
}

export default async function MatchDetailPage({ params }: MatchPageProps) {
  const supabase = await createClient();

  const resolvedParams = await params;
  const matchId = resolvedParams.id;

  // Usuario puede ser null — ruta pública
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Obtener detalles del partido
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

  if (matchError) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-red-900/40 p-6 rounded-2xl shadow-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-950/50 border border-red-800 flex items-center justify-center mx-auto text-red-400 font-bold text-xl">!</div>
          <h2 className="text-red-400 font-bold text-lg">Error de Base de Datos</h2>
          <p className="text-xs font-mono bg-slate-950 p-3 rounded-lg border border-slate-800 text-left overflow-x-auto text-slate-300">{matchError.message}</p>
          <Link href="/" className="inline-block text-xs text-blue-400 hover:underline pt-2">← Volver al Dashboard</Link>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex flex-col items-center justify-center p-4">
        <p className="text-sm font-semibold">El partido solicitado no existe.</p>
        <Link href="/" className="text-xs text-blue-400 mt-2 underline">Volver al Dashboard</Link>
      </div>
    );
  }

  // 2. Obtener eventos y comentarios
  const events = await getMatchEvents(matchId);
  const comments = await getComments(matchId);

  const eventIcon: Record<string, string> = {
    GOAL: "⚽ Gol",
    ASSIST: "👟 Asistencia",
    YELLOW_CARD: "🟨 Tarjeta Amarilla",
    RED_CARD: "🟥 Tarjeta Roja",
  };

  const eventColor: Record<string, string> = {
    GOAL: "bg-emerald-950/30 border-emerald-800 text-emerald-400",
    ASSIST: "bg-blue-950/30 border-blue-800 text-blue-400",
    YELLOW_CARD: "bg-amber-950/30 border-amber-800 text-amber-400",
    RED_CARD: "bg-red-950/30 border-red-800 text-red-400",
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-6">
        {/* Botón retroceso */}
        <Link href="/" className="inline-block text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest">
          ← Volver al Dashboard
        </Link>

        {/* Tarjeta del partido */}
        <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 md:p-8 shadow-2xl space-y-8">
          {/* Marcador */}
          <div className="flex items-center justify-between gap-4 py-4 border-b border-slate-800/60">
            <div className="flex flex-col items-center flex-1 text-center min-w-0">
              <img src={match.home_team?.logo_url} className="w-16 h-16 object-contain mb-2" alt={match.home_team?.name} />
              <span className="font-bold text-sm md:text-base truncate w-full text-slate-200">{match.home_team?.name}</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="bg-slate-950 px-6 py-3 rounded-2xl border border-slate-800/80 font-mono text-3xl font-black text-blue-400 tracking-tight shadow-inner">
                {match.status === "SCHEDULED" ? (
                  <span className="text-slate-500 text-lg font-bold">VS</span>
                ) : (
                  <>{match.home_score} : {match.away_score}</>
                )}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${match.status === "FINISHED" ? "text-emerald-400 border-emerald-800 bg-emerald-950/30" : "text-amber-400 border-amber-800 bg-amber-950/30"}`}>
                {match.status === "FINISHED" ? "Finalizado" : "Programado"}
              </span>
            </div>

            <div className="flex flex-col items-center flex-1 text-center min-w-0">
              <img src={match.away_team?.logo_url} className="w-16 h-16 object-contain mb-2" alt={match.away_team?.name} />
              <span className="font-bold text-sm md:text-base truncate w-full text-slate-200">{match.away_team?.name}</span>
            </div>
          </div>

          {/* Incidencias */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 text-center">Incidencias del Encuentro</h3>
            {events.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-6 bg-slate-950/30 border border-slate-900 rounded-2xl">
                No se han registrado incidencias en este partido todavía.
              </p>
            ) : (
              <div className="space-y-2.5">
                {events.map((event: any) => (
                  <div key={event.id} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-slate-900 text-xs text-slate-200 hover:border-slate-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-blue-400 bg-slate-900 border border-slate-800 px-2 py-1 rounded">{event.minute}′</span>
                      <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                        <img
                          src={event.players?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(event.players?.name || "player")}`}
                          alt={event.players?.name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-slate-200 text-sm">{event.players?.name}</p>
                        <p className="text-slate-500 text-[10px] uppercase tracking-wider">{event.teams?.name}</p>
                      </div>
                    </div>
                    <span className={`font-bold uppercase tracking-wider text-[10px] px-3 py-1 rounded-full border ${eventColor[event.type] || "bg-slate-900 border-slate-700 text-slate-400"}`}>
                      {eventIcon[event.type] || event.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ============================================
            SECCIÓN DE COMENTARIOS
            ============================================ */}
        <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">
              Comentarios ({comments.length})
            </h3>
          </div>

          {/* Lista de comentarios */}
          {comments.length === 0 ? (
            <p className="text-xs text-slate-600 text-center py-6 bg-slate-950/30 border border-slate-900 rounded-2xl">
              Sé el primero en comentar este partido.
            </p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {comments.map((comment: any) => (
                <div key={comment.id} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-900/40 border border-blue-800/50 flex items-center justify-center text-blue-400 font-bold text-xs flex-shrink-0">
                      {comment.user_id.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-mono text-slate-600 mb-1">
                        {new Date(comment.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="text-sm text-slate-200 break-words">{comment.content}</p>
                    </div>
                  </div>
                  {/* Botón borrar solo visible al autor */}
                  {user?.id === comment.user_id && (
                    <form action={deleteComment} className="flex-shrink-0">
                      <input type="hidden" name="commentId" value={comment.id} />
                      <button type="submit" className="text-red-500 hover:text-red-400 text-xs font-bold px-2 py-1 rounded-lg hover:bg-red-950/30 transition-colors">✕</button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Formulario para comentar */}
          {user ? (
            <form action={addComment} className="flex gap-3 items-end">
              <input type="hidden" name="matchId" value={matchId} />
              <div className="flex-1">
                <textarea
                  name="content"
                  rows={2}
                  maxLength={500}
                  placeholder="Escribe tu comentario sobre el partido..."
                  required
                  className="w-full bg-slate-950/60 border border-slate-800 text-slate-200 text-sm rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all placeholder-slate-600"
                />
              </div>
              <button
                type="submit"
                className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl transition-colors"
              >
                Publicar
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-800 rounded-xl">
              <p className="text-xs text-slate-400">Inicia sesión para dejar un comentario.</p>
              <Link href="/login" className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">Iniciar Sesión →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
