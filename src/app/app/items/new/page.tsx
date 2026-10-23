import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ItemForm } from "@/components/item-form";

export default function NewItemPage() {
  return (
    <div>
      <Link
        href="/app"
        className="mb-6 inline-flex items-center gap-1.5 text-[12px] text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" />
        Back to the shelf
      </Link>
      <ItemForm />
    </div>
  );
}
