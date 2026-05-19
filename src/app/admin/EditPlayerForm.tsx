// src/app/admin/EditPlayerForm.tsx
"use client";

import { useState } from "react";

interface EditPlayerFormProps {
  players: any[];
  updatePlayer: (formData: FormData) => Promise<void>;
}

export function EditPlayerForm({ players, updatePlayer }: EditPlayerFormProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const currentPlayer = players.find((p) => p.id === selectedPlayerId);

  return (
    <div className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
      <div>
        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
          Seleccionar Jugador
        </label>
        <select
          value={selectedPlayerId}
          onChange={(e) => setSelectedPlayerId(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg p-2.5 text-slate-200 focus:outline-none"
        >
          <option value="">-- Elige un jugador para editar --</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.teams?.name || "Agente Libre"})
            </option>
          ))}
        </select>
      </div>

      {selectedPlayerId && currentPlayer && (
        /* 🌟 EL TRUCO ESTÁ AQUÍ: Añadiendo key={currentPlayer.id}, forzamos a React a reconstruir 
          el formulario cada vez que cambia el futbolista, actualizando los defaultValues al instante.
        */
        <form
          key={currentPlayer.id}
          action={updatePlayer}
          className="space-y-3 pt-2 border-t border-slate-800/60 animate-in fade-in duration-200"
        >
          <input type="hidden" name="id" value={currentPlayer.id} />

          <div>
            <label className="text-[10px] text-slate-500 block mb-0.5">
              Nombre del Jugador
            </label>
            <input
              type="text"
              name="name"
              defaultValue={currentPlayer.name}
              required
              className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg p-2 text-slate-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-500 block mb-0.5">
              URL de la Foto / Cara
            </label>
            <input
              type="text"
              name="avatar_url"
              defaultValue={currentPlayer.avatar_url || ""}
              placeholder="https://link-a-la-foto.png"
              required
              className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg p-2 text-slate-200 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase py-2 rounded-lg transition-all shadow-md"
          >
            Actualizar Perfil
          </button>
        </form>
      )}
    </div>
  );
}
