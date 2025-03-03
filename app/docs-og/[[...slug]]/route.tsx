import { generateOGImage } from "fumadocs-ui/og";
import { metadataImage } from "@/lib/fumadocs/metadata";

export const GET = metadataImage.createAPI((page) => {
  return generateOGImage({
    title: page.data.title,
    site: "Iffy Docs",
  });
});

export function generateStaticParams() {
  return metadataImage.generateParams();
}
