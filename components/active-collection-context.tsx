"use client";

import React from "react";
import { UseInfiniteQueryResult } from "@tanstack/react-query";

export type ActiveCollectionQueryResult<TData> = UseInfiniteQueryResult<TData, unknown>;

interface ActiveCollectionContextType<TData> {
  query?: ActiveCollectionQueryResult<TData>;
  setQuery: React.Dispatch<React.SetStateAction<ActiveCollectionQueryResult<TData> | undefined>>;
}

const ActiveCollectionContext = React.createContext<ActiveCollectionContextType<any> | undefined>(undefined);

export function ActiveCollectionProvider<TData>({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = React.useState<ActiveCollectionQueryResult<TData> | undefined>(undefined);
  const value: ActiveCollectionContextType<TData> = { query, setQuery };
  return <ActiveCollectionContext.Provider value={value}>{children}</ActiveCollectionContext.Provider>;
}

export function useActiveCollection<TData>() {
  const context = React.useContext<ActiveCollectionContextType<TData> | undefined>(ActiveCollectionContext);
  if (!context) {
    throw new Error("useActiveCollection must be used within an ActiveCollectionProvider");
  }
  return context;
}
