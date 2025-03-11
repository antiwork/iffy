"use client";

import { createContext, useContext, useState, useMemo, useEffect } from "react";
import * as schema from "@/db/schema";

type ModerationId = (typeof schema.moderations.$inferSelect)["id"];
type userId = (typeof schema.users.$inferSelect)["id"];

type ModalCollectionContextType = {
  collection: ModerationId[] | userId[];
  setCollection: React.Dispatch<React.SetStateAction<ModerationId[] | userId[]>>;
  currentIndex: number | undefined;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number | undefined>>;
};

const ModalCollectionContext = createContext<ModalCollectionContextType | null>(null);

export function ModalCollectionProvider({ children }: { children: React.ReactNode }) {
  const [collection, setCollection] = useState<ModerationId[] | userId[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number | undefined>(undefined);

  return (
    <ModalCollectionContext.Provider value={{ collection, setCollection, currentIndex, setCurrentIndex }}>
      {children}
    </ModalCollectionContext.Provider>
  );
}

export function useModalCollection(rowId?: string) {
  const context = useContext(ModalCollectionContext);
  if (!context) {
    throw new Error("useModalCollection must be used within a ModalCollectionProvider");
  }

  const { collection, setCollection, currentIndex, setCurrentIndex } = context;

  const index = useMemo(() => {
    return collection.findIndex((id) => String(id) === rowId);
  }, [collection, rowId]);

  useEffect(() => {
    if (index !== -1 && index !== currentIndex) {
      setCurrentIndex(index);
    }
  }, [index, currentIndex, setCurrentIndex]);

  return {
    setCollection,
    currentIndex: index !== -1 ? index : undefined,
    previousRowId: index > 0 ? collection[index - 1] : null,
    nextRowId: index < collection.length - 1 ? collection[index + 1] : null,
  };
}
