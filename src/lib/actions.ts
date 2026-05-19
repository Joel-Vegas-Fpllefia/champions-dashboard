// src/lib/actions.ts
"use server";

import { createClient } from "../lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation"; // <-- ¡IMPORTANTE: Añade esta línea arriba del todo!

/** ==========================================
 * 1. ACCIONES DE AUTENTICACIÓN (LOGIN/REGISTRO)
 * ========================================== */

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);

  // En lugar de revalidatePath, ahora obligamos a ir al Dashboard principal
  redirect("/");
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);

  // Tras registrarse con éxito, lo mandamos directo adentro
  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Al cerrar sesión, lo expulsamos formalmente a la página de login
  redirect("/login");
}

/** ==========================================
 * 2. ACCIONES DEL DASHBOARD DE PARTIDOS
 * ========================================== */

// Trae los partidos ordenando primero los del equipo favorito del usuario
export async function getDashboardMatches() {
  const supabase = await createClient();

  // Obtener el usuario autenticado actual
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let favoriteTeamId = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("favorite_team_id")
      .eq("id", user.id)
      .single();
    favoriteTeamId = profile?.favorite_team_id;
  }

  // Traer partidos con los datos de los equipos locales y visitantes
  const { data: matches } = await supabase.from("matches").select(`
      *,
      home_team:teams!home_team_id(name, logo_url),
      away_team:teams!away_team_id(name, logo_url)
    `);

  if (!matches) return [];

  // Si el usuario tiene equipo favorito, ordenamos para que salgan primero sus partidos
  if (favoriteTeamId) {
    return matches.sort((a, b) => {
      const aIsFav =
        a.home_team_id === favoriteTeamId || a.away_team_id === favoriteTeamId;
      const bIsFav =
        b.home_team_id === favoriteTeamId || b.away_team_id === favoriteTeamId;
      return aIsFav === bIsFav ? 0 : aIsFav ? -1 : 1;
    });
  }

  return matches;
}

/** ==========================================
 * 3. ACCIONES DE ADMINISTRADOR (CRUD / PLANTILLAS)
 * ========================================== */

// Función interna para verificar si el usuario que hace la petición es administrador
async function checkIsAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "admin";
}

// Añadir al final de src/lib/actions.ts

export async function getMatchDetails(matchId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("matches")
    .select(
      `
      *,
      home_team:teams!matches_home_team_id_fkey(*),
      away_team:teams!matches_away_team_id_fkey(*)
    `,
    )
    .eq("id", matchId)
    .single();

  if (error) {
    console.error("Error cargando el partido:", error.message);
    return null;
  }

  return data;
}
// Añadir al final de src/lib/actions.ts

export async function getTeams() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error al traer equipos:", error.message);
    return [];
  }
  return data;
}

// src/lib/actions.ts

// src/lib/actions.ts

export async function updateFavoriteTeam(formData: FormData) {
  const supabase = await createClient();

  // 1. Traer el usuario real autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No estás autenticado");

  const teamId = formData.get("teamId") as string;

  // 2. Guardar o actualizar en la tabla relacional real
  const { error } = await supabase.from("user_profiles").upsert({
    id: user.id,
    favorite_team_id: teamId || null,
    updated_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);

  // 3. Limpiar la caché y mandar de vuelta
  revalidatePath("/");
  redirect("/");
}

// Añadir al final de src/lib/actions.ts

export async function getStandings() {
  const supabase = await createClient();

  // 1. Traer todos los equipos
  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("*");
  // 2. Traer todos los partidos
  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("*");

  if (teamsError || matchesError) {
    console.error("Error al calcular la clasificación");
    return [];
  }

  // 3. Crear un mapa para acumular las estadísticas de cada equipo
  const standingsMap: Record<string, any> = {};

  teams.forEach((team) => {
    standingsMap[team.id] = {
      id: team.id,
      name: team.name,
      logo_url: team.logo_url,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0, // Goles a Favor
      ga: 0, // Goles en Contra
      gd: 0, // Diferencia de Goles
      points: 0,
    };
  });

  // 4. Procesar cada partido para calcular los puntos
  matches.forEach((match) => {
    const home = standingsMap[match.home_team_id];
    const away = standingsMap[match.away_team_id];

    if (home && away) {
      home.played += 1;
      away.played += 1;
      home.gf += match.home_score;
      home.ga += match.away_score;
      away.gf += match.away_score;
      away.ga += match.home_score;

      if (match.home_score > match.away_score) {
        // Gana Local
        home.won += 1;
        home.points += 3;
        away.lost += 1;
      } else if (match.home_score < match.away_score) {
        // Gana Visitante
        away.won += 1;
        away.points += 3;
        home.lost += 1;
      } else {
        // Empate
        home.drawn += 1;
        home.points += 1;
        away.drawn += 1;
        away.points += 1;
      }

      home.gd = home.gf - home.ga;
      away.gd = away.gf - away.ga;
    }
  });

  // 5. Convertir a array y ordenar (1º Puntos, 2º Diferencia de goles, 3º Goles a favor)
  return Object.values(standingsMap).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });
}
// Añadir al final de src/lib/actions.ts

export async function getPlayers() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("players")
    .select("*, teams(name, logo_url)")
    .order("name", { ascending: true });

  if (error) {
    // 🔴 Hemos cambiado esto para que ROMPA la pantalla si hay un error
    // en lugar de devolver un array vacío silenciosamente.
    throw new Error("Supabase Error en Jugadores: " + error.message);
  }

  return data || [];
}

export async function transferPlayer(formData: FormData) {
  const supabase = await createClient();

  const playerId = formData.get("playerId") as string;
  const newTeamId = formData.get("newTeamId") as string;

  // Actualizamos el team_id del jugador
  const { error } = await supabase
    .from("players")
    .update({ team_id: newTeamId })
    .eq("id", playerId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin");
}

// ==========================================
// CRUD EQUIPOS
// ==========================================
export async function createTeam(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const coach_name = formData.get("coach_name") as string;
  const logo_url = formData.get("logo_url") as string;

  const { error } = await supabase
    .from("teams")
    .insert([{ name, coach_name, logo_url }]);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function deleteTeam(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;

  const { error } = await supabase.from("teams").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

// ==========================================
// GESTIÓN DE USUARIOS
// ==========================================
export async function getUserProfiles() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*, teams(name)");
  if (error) return [];
  return data;
}

export async function deleteUserProfile(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;

  const { error } = await supabase.from("user_profiles").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

// ==========================================
// EVENTOS DE PARTIDO
// ==========================================
// En src/lib/actions.ts, busca y actualiza esta función:

export async function getMatchEvents(matchId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("match_events")
    .select(
      `
      id,
      type,
      minute,
      teams(name),
      players(name, avatar_url) -- 🔴 ¡ASEGÚRATE DE AÑADIR avatar_url AQUÍ!
    `,
    )
    .eq("match_id", matchId)
    .order("minute", { ascending: true });

  if (error) {
    console.error("Error al traer incidencias:", error.message);
    return [];
  }

  return data || [];
}

// Añadir al final de src/lib/actions.ts

export async function createMatchEvent(formData: FormData) {
  const supabase = await createClient();

  const matchId = formData.get("matchId") as string;
  const playerId = formData.get("playerId") as string;
  const type = formData.get("type") as string;
  const minute = parseInt(formData.get("minute") as string, 10);

  // Conseguimos el equipo del jugador automáticamente para no tener que pedirlo
  const { data: player } = await supabase
    .from("players")
    .select("team_id")
    .eq("id", playerId)
    .single();

  if (!player) throw new Error("Jugador no encontrado");

  const { error } = await supabase.from("match_events").insert([
    {
      match_id: matchId,
      player_id: playerId,
      team_id: player.team_id,
      type,
      minute,
    },
  ]);

  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath(`/matches/${matchId}`);
}
export async function updateTeam(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const coach_name = formData.get("coach_name") as string;
  const logo_url = formData.get("logo_url") as string;

  const { error } = await supabase
    .from("teams")
    .update({ name, coach_name, logo_url })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath("/"); // Revalida el dashboard para que cambie el escudo allí también
}
export async function updatePlayer(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const avatar_url = formData.get("avatar_url") as string;

  const { error } = await supabase
    .from("players")
    .update({ name, avatar_url })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath("/matches");
  revalidatePath("/", "layout"); // Para que se actualice en las vistas de los partidos
}
