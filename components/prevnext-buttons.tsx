import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

export interface NavigableItem {
  id: string;
  [key: string]: any;
}

export interface PrevNextButtonsProps {
  /** Currently active item's id */
  currentItemId: string;
  /** The entire collection used for navigation */
  items: NavigableItem[];
  /** Callback when moving to the previous item */
  onPrev: (newItemId: string) => void;
  /** Callback when moving to the next item */
  onNext: (newItemId: string) => void;
  fetchNextItems?: () => Promise<any>;
  hasNextItems?: boolean;
}

export function PrevNextButtons({
  currentItemId,
  items,
  onPrev,
  onNext,
  fetchNextItems,
  hasNextItems = false,
}: PrevNextButtonsProps) {
  const [isFetchingNext, setIsFetchingNext] = React.useState(false);

  const currentIndex = items.findIndex((item) => item.id === currentItemId);
  const exhausted = currentIndex >= 0 && (currentIndex < items.length - 1 || (hasNextItems && fetchNextItems));
  const canGoPrev = currentIndex > 0;
  const canGoNext = items[currentIndex + 1];

  const handlePrev = () => {
    if (!canGoPrev) return;

    const prevItem = items[currentIndex - 1];
    onPrev(prevItem!.id);
  };

  const handleNext = async () => {
    if (canGoNext) {
      const nextItem = items[currentIndex + 1];
      onNext(nextItem!.id);
    } else if (hasNextItems && fetchNextItems) {
      setIsFetchingNext(true);
      const nextItems: NavigableItem[] = await fetchNextItems();
      setIsFetchingNext(false);
      const nextItem = nextItems[currentIndex + 1];
      // should become available after fetching new page
      if (nextItem) {
        onNext(nextItem.id);
      }
    }
  };

  return (
    <div className="flex justify-between">
      <Button onClick={handlePrev} variant="outline" size="sm" disabled={!canGoPrev}>
        <ArrowLeft />
        Previous
      </Button>
      <Button onClick={handleNext} variant="outline" size="sm" disabled={!exhausted || isFetchingNext}>
        Next
        <ArrowRight />
      </Button>
    </div>
  );
}
