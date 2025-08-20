import React from "react";
import { useMarketplace } from "../store/marketplace";

export default function UserSwitcher() {
  const { users, vendors, currentUserId, switchUser } = useMarketplace();
  const allUsers = [...users, ...vendors];

  return (
    <select
      value={currentUserId ?? ""}
      onChange={(e) => switchUser(e.target.value)}
      className="px-3 py-2 text-sm rounded-lg border w-full sm:w-auto"
      aria-label="Switch user"
    >
      <option value="">Guest</option>
      {allUsers.map((u) => (
        <option key={u.id} value={u.id}>
          {u.name} ({u.role})
        </option>
      ))}
    </select>
  );
}