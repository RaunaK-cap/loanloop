import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CategoryArtwork } from "@/components/category-icon";
import { ItemStatusBadge } from "@/components/status-badges";
import { Avatar } from "@/components/ui/avatar";
import { TrustPill } from "@/components/ui/trust-pill";
import { CATEGORY_LABELS, CONDITION_LABELS } from "@/lib/constants";
import type { Item } from "@/lib/types";
import { cn, truncate } from "@/lib/utils";

export function ItemCard({
  item,
  currentUserId,
  className,
}: {
  item: Item;
  currentUserId?: string;
  className?: string;
}) {
  const isOwn = item.owner_id === currentUserId;

  return (
    <Link
      href={`/app/items/${item.$id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-[18px] border border-line bg-surface transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-soft",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={item.title}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <CategoryArtwork category={item.category} className="size-full" />
        )}
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <ItemStatusBadge status={item.status} />
        </div>
        <div className="absolute right-3 top-3 rounded-full bg-surface/90 p-1.5 text-ink opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
          <ArrowUpRight className="size-3.5" />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-medium tracking-[-0.015em] text-ink">
              {item.title}
            </h3>
            <p className="mt-0.5 text-[11px] text-muted">
              {CATEGORY_LABELS[item.category]} · {CONDITION_LABELS[item.condition]}
            </p>
          </div>
        </div>

        <p className="mt-2 line-clamp-2 text-pretty text-[13px] leading-5 text-muted">
          {truncate(item.description, 120)}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar
              name={item.owner?.display_name ?? "Neighbor"}
              id={item.owner_id}
              size="xs"
            />
            <span className="truncate text-[11px] text-muted">
              {isOwn ? "Yours" : item.owner?.display_name ?? "A neighbor"}
            </span>
          </div>
          {item.owner ? <TrustPill score={item.owner.trust_score} /> : null}
        </div>
      </div>
    </Link>
  );
}
