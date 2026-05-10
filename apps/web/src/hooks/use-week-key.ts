"use client";

import { useEffect, useState } from "react";

import { getWeekKey } from "@/lib/week-key";

export function useWeekKey() {
  const [weekKey, setWeekKey] = useState(() => getWeekKey());

  useEffect(() => {
    const refreshWeekKey = () => {
      setWeekKey((currentWeekKey) => {
        const nextWeekKey = getWeekKey();
        return nextWeekKey === currentWeekKey ? currentWeekKey : nextWeekKey;
      });
    };

    refreshWeekKey();
    const interval = window.setInterval(refreshWeekKey, 60 * 60 * 1000);
    window.addEventListener("focus", refreshWeekKey);
    document.addEventListener("visibilitychange", refreshWeekKey);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshWeekKey);
      document.removeEventListener("visibilitychange", refreshWeekKey);
    };
  }, []);

  return weekKey;
}
