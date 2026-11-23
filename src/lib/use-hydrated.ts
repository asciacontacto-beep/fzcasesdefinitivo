"use client";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** false en el render del servidor y en la hidratación, true después. */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
