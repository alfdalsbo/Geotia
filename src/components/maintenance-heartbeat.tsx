"use client";

import { useEffect } from "react";

const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000;

function sendHeartbeat() {
  void fetch("/api/maintenance/heartbeat", {
    method: "POST",
    cache: "no-store",
    credentials: "same-origin",
  }).catch(() => undefined);
}

export function MaintenanceHeartbeat() {
  useEffect(() => {
    let intervalId: number | undefined;

    const stop = () => {
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
        intervalId = undefined;
      }
    };

    const start = () => {
      if (document.visibilityState !== "visible" || intervalId !== undefined) return;

      sendHeartbeat();
      intervalId = window.setInterval(() => {
        if (document.visibilityState === "visible") {
          sendHeartbeat();
        }
      }, HEARTBEAT_INTERVAL_MS);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        start();
      } else {
        stop();
      }
    };

    start();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return null;
}
