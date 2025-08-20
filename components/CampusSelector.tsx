import React from "react";
import { useMarketplace } from "../store/marketplace";

export default function CampusSelector() {
  const { campuses, currentCampusId, setCampus } = useMarketplace();

  return (
    <select
      value={currentCampusId}
      onChange={(e) => setCampus(e.target.value)}
      className="px-3 py-2 text-sm rounded-lg border w-full sm:w-auto"
      aria-label="Select campus"
    >
      {campuses.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}