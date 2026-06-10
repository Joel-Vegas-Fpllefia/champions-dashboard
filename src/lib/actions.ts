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
  if (error) {
    const messages: Record<string, string> = {
      "Invalid login credentials": "Correo o contraseña incorrectos.",
      "Email not confirmed": "Debes confirmar tu correo antes de iniciar sesión.",
      "Too many requests": "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
    };
    return { error: messages[error.message] ?? error.message };
  }
 
  redirect("/");
}
 

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
 
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    const messages: Record<string, string> = {
      "User already registered": "Ya existe una cuenta con este correo. Prueba a iniciar sesión.",
      "Password should be at least 6 characters": "La contraseña debe tener al menos 6 caracteres.",
      "Unable to validate email address: invalid format": "El formato del correo no es válido.",
      "Signup is disabled": "El registro está deshabilitado en este momento.",
    };
    return { error: messages[error.message] ?? error.message };
  }
 
  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Al cerrar sesión, lo expulsamos formalmente a la página de login
  redirect("/");
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
// Añadir al final de src/lib/actions.ts

// En src/lib/actions.ts actualiza esta función:

export async function createMatch(formData: FormData) {
  const supabase = await createClient();
  const home_team_id = formData.get("home_team_id") as string;
  const away_team_id = formData.get("away_team_id") as string;

  if (home_team_id === away_team_id)
    throw new Error("Un equipo no puede jugar contra sí mismo.");

  const { error } = await supabase.from("matches").insert([
    {
      home_team_id,
      away_team_id,
      home_score: 0,
      away_score: 0,
      status: "SCHEDULED",
      match_date: new Date().toISOString(), // 🌟 ¡AÑADE ESTA LÍNEA AQUÍ!
    },
  ]);

  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath("/", "layout");
}

export async function simulateMatch(formData: FormData) {
  const supabase = await createClient();
  const matchId = formData.get("matchId") as string;

  // 1. Conseguir los datos del partido
  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single();
  if (!match) throw new Error("Partido no encontrado");

  // 2. Traer los jugadores de ambos equipos para repartir los sucesos
  const { data: homePlayers } = await supabase
    .from("players")
    .select("id, team_id")
    .eq("team_id", match.home_team_id);
  const { data: awayPlayers } = await supabase
    .from("players")
    .select("id, team_id")
    .eq("team_id", match.away_team_id);

  if (
    !homePlayers ||
    !awayPlayers ||
    homePlayers.length === 0 ||
    awayPlayers.length === 0
  ) {
    throw new Error(
      "Ambos equipos deben tener jugadores registrados para poder simular",
    );
  }

  // Helper para sacar un jugador aleatorio de una lista
  const getRandomPlayer = (playersList: any[]) =>
    playersList[Math.floor(Math.random() * playersList.length)];

  // 3. Generar estadísticas aleatorias lógicas (Goles entre 0 y 4 por equipo)
  const homeScore = Math.floor(Math.random() * 5);
  const awayScore = Math.floor(Math.random() * 5);

  const eventsToInsert: any[] = [];

  // Simular eventos del Equipo Local
  for (let i = 0; i < homeScore; i++) {
    const scorer = getRandomPlayer(homePlayers);
    const minute = Math.floor(Math.random() * 90) + 1;
    eventsToInsert.push({
      match_id: matchId,
      player_id: scorer.id,
      team_id: match.home_team_id,
      type: "GOAL",
      minute,
    });

    // 50% de probabilidad de que el gol tenga asistencia
    if (Math.random() > 0.5 && homePlayers.length > 1) {
      let assistor = getRandomPlayer(homePlayers);
      while (assistor.id === scorer.id) {
        assistor = getRandomPlayer(homePlayers);
      } // Que no se asista a sí mismo
      eventsToInsert.push({
        match_id: matchId,
        player_id: assistor.id,
        team_id: match.home_team_id,
        type: "ASSIST",
        minute,
      });
    }
  }

  // Simular eventos del Equipo Visitante
  for (let i = 0; i < awayScore; i++) {
    const scorer = getRandomPlayer(awayPlayers);
    const minute = Math.floor(Math.random() * 90) + 1;
    eventsToInsert.push({
      match_id: matchId,
      player_id: scorer.id,
      team_id: match.away_team_id,
      type: "GOAL",
      minute,
    });

    if (Math.random() > 0.5 && awayPlayers.length > 1) {
      let assistor = getRandomPlayer(awayPlayers);
      while (assistor.id === scorer.id) {
        assistor = getRandomPlayer(awayPlayers);
      }
      eventsToInsert.push({
        match_id: matchId,
        player_id: assistor.id,
        team_id: match.away_team_id,
        type: "ASSIST",
        minute,
      });
    }
  }

  // Tarjetas aleatorias (entre 1 y 4 amarillas repartidas por el partido)
  const totalCards = Math.floor(Math.random() * 4) + 1;
  for (let i = 0; i < totalCards; i++) {
    const isHome = Math.random() > 0.5;
    const player = getRandomPlayer(isHome ? homePlayers : awayPlayers);
    const minute = Math.floor(Math.random() * 90) + 1;
    eventsToInsert.push({
      match_id: matchId,
      player_id: player.id,
      team_id: player.team_id,
      type: Math.random() > 0.9 ? "RED_CARD" : "YELLOW_CARD", // 10% de que sea roja
      minute,
    });
  }

  // 4. Guardar todo en Supabase
  // Actualizamos el marcador del partido
  await supabase
    .from("matches")
    .update({
      home_score: homeScore,
      away_score: awayScore,
      status: "FINISHED",
    })
    .eq("id", matchId);

  // Insertamos la lluvia de actas e incidencias generadas
  if (eventsToInsert.length > 0) {
    await supabase.from("match_events").insert(eventsToInsert);
  }

  revalidatePath("/admin");
  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/");
}

/** ==========================================
 * 6. COMENTARIOS DE PARTIDOS
 * ========================================== */

export async function getComments(matchId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("comments")
    .select("id, content, created_at, user_id")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error al traer comentarios:", error.message);
    return [];
  }
  return data || [];
}

export async function addComment(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Debes iniciar sesión para comentar.");

  const matchId = formData.get("matchId") as string;
  const content = (formData.get("content") as string)?.trim();

  if (!content || content.length < 1) throw new Error("El comentario no puede estar vacío.");
  if (content.length > 500) throw new Error("Máximo 500 caracteres.");

  const { error } = await supabase.from("comments").insert([
    { match_id: matchId, user_id: user.id, content },
  ]);

  if (error) throw new Error(error.message);

  revalidatePath(`/matches/${matchId}`);
}

export async function deleteComment(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");

  const commentId = formData.get("commentId") as string;

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id); // Solo puede borrar el autor

  if (error) throw new Error(error.message);
  revalidatePath("/matches");
}

/** ==========================================
 * 7. GESTIÓN DE ROLES (Solo ADMIN)
 * ========================================== */

export async function changeUserRole(formData: FormData) {
  const supabase = await createClient();

  // Solo un admin puede cambiar roles
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");

  const { data: callerProfile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (callerProfile?.role !== "admin") throw new Error("Acceso denegado. Solo los administradores pueden cambiar roles.");

  const targetUserId = formData.get("userId") as string;
  const newRole = formData.get("role") as string;

  const validRoles = ["user", "editor", "admin"];
  if (!validRoles.includes(newRole)) throw new Error("Rol no válido.");

  const { error } = await supabase
    .from("user_profiles")
    .update({ role: newRole })
    .eq("id", targetUserId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin");
}

