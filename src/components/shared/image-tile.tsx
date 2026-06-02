import { Download, Heart, ImageOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ImageTile({
  title,
  tag,
  color,
  downloaded,
  favorited,
  onDownload,
  onFavorite,
}: {
  title: string;
  tag: string;
  color: string;
  downloaded?: boolean;
  favorited?: boolean;
  onDownload?: () => void;
  onFavorite?: () => void;
}) {
  return (
    <article className="group relative min-h-48 overflow-hidden rounded-lg border border-primary/15 bg-primary/[0.04]">
      <div className={cn("absolute inset-0 bg-gradient-to-br", color)} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,.28),transparent_22%),linear-gradient(120deg,transparent,rgba(0,0,0,.55))]" />
      <div className="absolute left-3 top-3">
        <Badge>{tag}</Badge>
      </div>
      <div className="absolute right-3 top-3 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <Button size="icon" variant="icon" aria-label={downloaded ? "Downloaded" : "Download image"} onClick={onDownload} type="button">
          <Download className="size-4" />
        </Button>
        <Button size="icon" variant="icon" aria-label={favorited ? "Remove from favorites" : "Add to favorites"} onClick={onFavorite} type="button">
          <Heart className={cn("size-4", favorited && "fill-primary text-primary")} />
        </Button>
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 bg-black/45 p-3 backdrop-blur">
        <ImageOff className="size-4 text-primary" />
        <p className="truncate text-sm font-medium text-white">{title}</p>
      </div>
    </article>
  );
}
