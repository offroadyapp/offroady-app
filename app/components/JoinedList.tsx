"use client";

import { useState } from "react";
import JoinTrail from "./JoinTrail";

export default function JoinedList() {
  const [users, setUsers] = useState([
    "RockFox",
    "MudDog",
    "NightRunner",
    "BCJeep",
  ]);

  return (
    <div className="mt-5 rounded-xl bg-[#f7faf6] p-4 text-sm text-gray-700">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold text-[#243126]">
            {users.length} people joined
          </h4>
          <p className="mt-1 text-sm text-gray-600">
            {users.join(" · ")}
          </p>
        </div>

        <JoinTrail
          onJoin={(name) => {
            const trimmed = name.trim();
            if (!trimmed) return;
            if (users.includes(trimmed)) return;
            setUsers([...users, trimmed]);
          }}
        />
      </div>
    </div>
  );
}