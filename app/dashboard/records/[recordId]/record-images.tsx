"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";

export function RecordImages({ imageUrls }: { imageUrls: string[] }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <>
      <div className="grid gap-4">
        <dt className="text-stone-500">Images</dt>
        <dd className="flex flex-wrap gap-2">
          {imageUrls.map((url, index) => (
            <div key={index} className="relative">
              <img
                src={url}
                className="h-16 w-16 cursor-pointer rounded-md object-cover transition-opacity hover:opacity-80"
                onClick={() => setSelectedImage(url)}
                alt={`Image ${index}`}
              />
            </div>
          ))}
        </dd>
      </div>
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Image Preview</DialogTitle>
            </DialogHeader>
            <div className="flex h-full w-full items-center justify-center">
              <img src={selectedImage} alt="Preview" className="max-h-[70vh] max-w-full object-contain" />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
