"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/axios";

type ApiResponse = { message: string; people: string[] };

export default function Home() {
  const [message, setMessage] = useState("Loading…");
  const [people, setPeople] = useState<string[]>([]);
  const [newPerson, setNewPerson] = useState("");

  useEffect(() => {
    api.get<ApiResponse>("/api/home")
      .then(({ data }) => {
        setMessage(data.message);
        setPeople(data.people ?? []);
      })
      .catch(() => setMessage("Failed to load"));
  }, []);

  const add = async () => {
    const name = newPerson.trim();
    if (!name) return;
    await api.post("/api/home", { name });
    const { data } = await api.get<ApiResponse>("/api/home");
    setPeople(data.people ?? []);
    setNewPerson("");
  };

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">{message}</h1>

      <div className="space-x-2">
        <input
          value={newPerson}
          onChange={(e) => setNewPerson(e.target.value)}
          placeholder="Add name"
          className="border px-2 py-1 rounded"
        />
        <button onClick={add} className="border px-3 py-1 rounded">Add</button>
      </div>

      <div className="space-y-1">
        {people.map((p, i) => (
          <div key={i}>{p}</div>
        ))}
      </div>
    </main>
  );
}
