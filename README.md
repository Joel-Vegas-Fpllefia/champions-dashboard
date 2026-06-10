# ChampionsDash ⚽

Dashboard interactivo de la Champions League construido con **Next.js 15**, **Supabase** y **Tailwind CSS**. Permite seguir partidos en tiempo real, ver clasificaciones, leer incidencias, comentar en partidos y gestionar la competición desde un panel de administración basado en roles.

---

## ✨ Funcionalidades

| Funcionalidad | Acceso |
|---|---|
| Ver partidos y clasificación | Público (sin login) |
| Ver detalle de un partido e incidencias | Público |
| Comentar en un partido | Usuario registrado |
| Elegir equipo favorito | Usuario registrado |
| Gestionar equipos, partidos y jugadores | `editor` o `admin` |
| Gestionar usuarios y asignar roles | Solo `admin` |

---

## 🛠️ Stack Tecnológico

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router, Server Actions)
- **Base de datos & Auth:** [Supabase](https://supabase.com/) (PostgreSQL + Auth)
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
- **Lenguaje:** TypeScript
- **Deploy:** [Vercel](https://vercel.com/)

---

## 🚀 Instalación y ejecución local

### 1. Clona el repositorio

```bash
git clone https://github.com/tu-usuario/champions-dashboard.git
cd champions-dashboard
```

### 2. Instala las dependencias

```bash
npm install
```

### 3. Configura las variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

> ⚠️ Nunca subas `.env.local` a GitHub. Ya está incluido en `.gitignore`.

### 4. Configura la base de datos en Supabase

Ejecuta el siguiente SQL en el **SQL Editor** de tu proyecto de Supabase:

```sql
-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Equipos
CREATE TABLE public.teams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    coach_name TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Jugadores
CREATE TABLE public.players (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Partidos
CREATE TABLE public.matches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    home_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    away_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'SCHEDULED',
    match_date TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Eventos de partido (goles, tarjetas, asistencias)
CREATE TABLE public.match_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    minute INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Perfiles de usuario
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role TEXT DEFAULT 'user',
    favorite_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Vista para compatibilidad
CREATE OR REPLACE VIEW public.profiles AS SELECT * FROM public.user_profiles;

-- Comentarios en partidos
CREATE TABLE public.comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Trigger: crear perfil al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role, updated_at)
  VALUES (new.id, 'user', now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública
CREATE POLICY "Public read teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Public read players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Public read matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Public read events" ON public.match_events FOR SELECT USING (true);
CREATE POLICY "Public read comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Public read profiles" ON public.user_profiles FOR SELECT USING (true);

-- Políticas de escritura autenticada
CREATE POLICY "Auth write teams" ON public.teams FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth write players" ON public.players FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth write matches" ON public.matches FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth write events" ON public.match_events FOR ALL TO authenticated USING (true);
CREATE POLICY "Users insert profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Auth users comment" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own comment" ON public.comments FOR DELETE USING (auth.uid() = user_id);
```

### 5. Corre el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 👥 Sistema de Roles

| Rol | Permisos |
|---|---|
| `user` | Ver partidos, comentar, elegir equipo favorito |
| `editor` | Todo lo anterior + gestionar equipos, partidos y jugadores desde `/admin` |
| `admin` | Todo lo anterior + gestionar usuarios, asignar y cambiar roles |

### Asignar el primer administrador

Desde el **SQL Editor** de Supabase, ejecuta:

```sql
UPDATE public.user_profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'tu_correo@aqui.com');
```

---

## 🌍 Deploy en Vercel

1. Sube el proyecto a **GitHub** (`git push`).
2. Entra en [vercel.com](https://vercel.com/) y crea un nuevo proyecto importando el repositorio.
3. En la sección **Environment Variables** añade:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Haz clic en **Deploy**.

---

## 📁 Estructura del proyecto

```
src/
├── app/
│   ├── admin/          # Panel de administración (editor/admin)
│   ├── login/          # Página de login y registro
│   ├── matches/[id]/   # Detalle de partido + comentarios (pública)
│   ├── perfil/         # Perfil de usuario y equipo favorito
│   └── page.tsx        # Dashboard principal (pública)
├── lib/
│   ├── actions.ts      # Server Actions (auth, CRUD, comentarios, roles)
│   └── supabase/       # Clientes de Supabase (server y client)
└── middleware.ts        # Refresco de sesión
```

---

## ✅ Checklist de Verificación (IA7)

- [x] Visitante puede usar rutas **teams** y **matches** con datos de la DB.
- [x] Usuario puede **registrarse** e **iniciar sesión** sin errores.
- [x] Usuario registrado puede **comentar** en un partido.
- [x] `EDITOR` puede gestionar equipos/partidos/media; `ADMIN` puede gestionar usuarios/roles.
- [x] App desplegada en **Vercel** con variables de entorno configuradas de forma segura.

---

## 📄 Licencia

MIT
