import {
  BookOpen,
  CookingPot,
  Dumbbell,
  Lamp,
  Package,
  Projector,
  Tent,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { CategoryId } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ICONS: Record<CategoryId, LucideIcon> = {
  tools: Wrench,
  kitchen: CookingPot,
  camping: Tent,
  electronics: Projector,
  sports: Dumbbell,
  home: Lamp,
  books: BookOpen,
  other: Package,
};

export function CategoryIcon({
  category,
  className,
}: {
  category: CategoryId;
  className?: string;
}) {
  const Icon = ICONS[category] ?? Package;
  return <Icon className={cn("size-4", className)} />;
}

export function CategoryArtwork({
  category,
  className,
}: {
  category: CategoryId;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-[radial-gradient(circle_at_30%_20%,#fbf1ea,transparent_60%),linear-gradient(135deg,#f2e9dc,#e8dfd0)] text-accent/70",
        className,
      )}
    >
      <CategoryIcon category={category} className="size-9" />
    </div>
  );
}
