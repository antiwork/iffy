import { createMetadataImage } from 'fumadocs-core/server';
import { source } from '@/lib/fumadocs/source';

export const metadataImage: ReturnType<typeof createMetadataImage> = createMetadataImage({
  source,
});