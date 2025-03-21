import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

export interface NavigableItem {
  id: string;
  [key: string]: any;
}

export interface PreviousNextButtonsProps {
  currentItemId: string;
  items: NavigableItem[];
  onPrevious: (previousItemId: string) => void;
  onNext: (nextItemId: string) => void;
  fetchNextItems?: () => Promise<any>;
  hasNextItems?: boolean;
}

export function PreviousNextButtons({
  currentItemId,
  items,
  onPrevious,
  onNext,
  fetchNextItems,
  hasNextItems = false,
}: PreviousNextButtonsProps) {
  const [isFetchingNext, setIsFetchingNext] = React.useState(false);

  const currentIndex = items.findIndex((item) => item.id === currentItemId);
  const exhausted = currentIndex >= 0 && (currentIndex < items.length - 1 || (hasNextItems && fetchNextItems));
  const canGoPrev = currentIndex > 0;
  const canGoNext = items[currentIndex + 1];

  const handlePreiousOnClick = () => {
    const prevItem = items[currentIndex - 1];
    onPrevious(prevItem!.id);
  };

  const handleNextOnClick = async () => {
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
      <Button onClick={handlePreiousOnClick} variant="outline" size="sm" disabled={!canGoPrev}>
        <ArrowLeft />
        Previous
      </Button>
      <Button onClick={handleNextOnClick} variant="outline" size="sm" disabled={!exhausted || isFetchingNext}>
        Next
        <ArrowRight />
      </Button>
    </div>
  );
}
