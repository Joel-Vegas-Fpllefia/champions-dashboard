"use client";

import { useState } from "react";

interface EditTeamFormProps {
  teams: any[];
  createTeam: (formData: FormData) => Promise<void>;
  updateTeam: (formData: FormData) => Promise<void>;
}

export function EditTeamForm({
  teams,
  createTeam,
  updateTeam,
}: EditTeamFormProps) {
  const [selectedTeamId, setSelectedTeamId] = useState("");

  // Buscamos si hay un equipo seleccionado para editar
  const currentTeam = teams.find((t) => t.id === selectedTeamId);

  return (
    <div className="space-y-4">
      {/* Selector para decidir si editar o crear */}
      <div>
        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
          Modo de Edición
        </label>
        <select
          value={selectedTeamId}
          onChange={(e) => setSelectedTeamId(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg p-2.5 text-slate-200 focus:outline-none"
        >
          <option value="">✨ Crear un Nuevo Equipo</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              📝 Editar: {t.name}
            </option>
          ))}
        </select>
      </div>

      {selectedTeamId && currentTeam ? (
        /* FORMULARIO DE ACTUALIZACIÓN */
        <form
          action={updateTeam}
          className="bg-slate-950/60 p-4 rounded-xl border border-blue-500/30 space-y-3"
        >
          <p className="text-xs font-black text-blue-400 uppercase tracking-widest">
            Modificar Club
          </p>
          <input type="hidden" name="id" value={currentTeam.id} />

          <div>
            <label className="text-[10px] text-slate-500 block mb-0.5">
              Nombre
            </label>
            <input
              type="text"
              name="name"
              defaultValue={currentTeam.name}
              required
              className="w-full bg-slate-900 border border-slate-800 text-sm rounded-lg p-2 text-slate-200 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 block mb-0.5">
              Entrenador
            </label>
            <input
              type="text"
              name="coach_name"
              defaultValue={currentTeam.coach_name}
              required
              className="w-full bg-slate-900 border border-slate-800 text-sm rounded-lg p-2 text-slate-200 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 block mb-0.5">
              URL del Escudo
            </label>
            <input
              type="text"
              name="logo_url"
              defaultValue={currentTeam.logo_url}
              required
              className="w-full bg-slate-900 border border-slate-800 text-sm rounded-lg p-2 text-slate-200 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase py-2.5 rounded-lg transition-all"
          >
            Guardar Cambios
          </button>
        </form>
      ) : (
        /* FORMULARIO DE CREACIÓN COMPLETA */
        <form
          action={createTeam}
          className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-3"
        >
          <p className="text-xs font-black text-pink-400 uppercase tracking-widest">
            Añadir Nuevo Club
          </p>
          <input
            type="text"
            name="name"
            placeholder="Nombre del Club"
            required
            className="w-full bg-slate-900 border border-slate-800 text-sm rounded-lg p-2.5 text-slate-200 focus:outline-none"
          />
          <input
            type="text"
            name="coach_name"
            placeholder="Director Técnico"
            required
            className="w-full bg-slate-900 border border-slate-800 text-sm rounded-lg p-2.5 text-slate-200 focus:outline-none"
          />
          <input
            type="text"
            name="logo_url"
            placeholder="URL del Escudo"
            required
            className="w-full bg-slate-900 border border-slate-800 text-sm rounded-lg p-2.5 text-slate-200 focus:outline-none"
          />
          <button
            type="submit"
            className="w-full bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs uppercase py-2.5 rounded-lg transition-all"
          >
            Crear Equipo
          </button>
        </form>
      )}
    </div>
  );
}
