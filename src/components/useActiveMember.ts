"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "energy_station_active_member";

type Member = {
  id: string;
  name: string;
  role: "SELF" | "CHILD";
};

export function useActiveMember(members: Member[]) {
  const [activeId, setActiveId] = useState(members[0]?.id ?? "");

  useEffect(() => {
    if (members.length === 0) return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && members.some((member) => member.id === stored)) {
      setActiveId(stored);
      return;
    }
    setActiveId(members[0].id);
  }, [members]);

  useEffect(() => {
    if (!activeId) return;
    window.localStorage.setItem(STORAGE_KEY, activeId);
  }, [activeId]);

  const activeMember = useMemo(
    () => members.find((member) => member.id === activeId) ?? members[0],
    [activeId, members]
  );

  return { activeId, setActiveId, activeMember };
}
