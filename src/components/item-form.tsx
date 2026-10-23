"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { CATEGORIES, CONDITIONS } from "@/lib/constants";
import type { CategoryId, ConditionId } from "@/lib/constants";
import { createItem, uploadItemImage } from "@/lib/client-data";

export function ItemForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CategoryId>("tools");
  const [condition, setCondition] = useState<ConditionId>("good");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Keep the image under 5 MB.");
      return;
    }
    setError(null);
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (title.trim().length < 3) {
      setError("Give it a short, clear name.");
      return;
    }
    if (description.trim().length < 10) {
      setError("Add a sentence or two about the item.");
      return;
    }

    setSubmitting(true);
    try {
      let uploadedId = "";
      let uploadedUrl = imageUrl.trim();
      if (imageFile) {
        const upload = await uploadItemImage(imageFile);
        uploadedId = upload.fileId;
        uploadedUrl = upload.url;
      }

      const item = await createItem({
        title: title.trim(),
        description: description.trim(),
        category,
        condition,
        image_url: uploadedUrl || undefined,
        image_id: uploadedId || undefined,
      });

      toast.success("Listed on the shelf.");
      router.push(`/app/items/${item.$id}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not list that item.";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow="Add to the shelf"
        title={
          <>
            What&apos;s gathering{" "}
            <span className="font-display italic text-accent">dust?</span>
          </>
        }
        description="A good listing is specific and honest. A photo, a condition, and the small detail that helps a neighbor decide."
      />

      <form
        onSubmit={onSubmit}
        className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-start"
      >
        <div className="rounded-[18px] border border-line bg-surface p-4">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-dashed border-line bg-surface-2">
            {preview ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Listing preview"
                  className="size-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPreview(null);
                    setImageFile(null);
                    setImageUrl("");
                  }}
                  className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-ink/70 text-white backdrop-blur"
                  aria-label="Remove image"
                >
                  <X className="size-3.5" />
                </button>
              </>
            ) : (
              <label className="flex size-full cursor-pointer flex-col items-center justify-center gap-2 text-muted transition-colors hover:text-ink">
                <span className="flex size-11 items-center justify-center rounded-full bg-surface text-muted">
                  <ImagePlus className="size-5" />
                </span>
                <span className="text-[12px] font-medium">Add a photo</span>
                <span className="text-[10px]">JPG, PNG, WebP · under 5 MB</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={onFile}
                />
              </label>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <label
              htmlFor="image_url"
              className="text-[11px] font-medium text-muted"
            >
              Or paste an image URL
            </label>
            <Input
              id="image_url"
              value={imageUrl}
              onChange={(event) => {
                setImageUrl(event.target.value);
                setPreview(event.target.value || null);
                setImageFile(null);
              }}
              placeholder="https://…"
              type="url"
            />
          </div>

          <div className="mt-4 rounded-xl bg-surface-2/70 p-3.5">
            <p className="flex items-start gap-2 text-[11px] leading-5 text-muted">
              <Sparkles className="mt-0.5 size-3.5 shrink-0 text-accent" />
              Listings with a real photo and a specific detail get approved
              faster. Mention what&apos;s included.
            </p>
          </div>
        </div>

        <div className="rounded-[18px] border border-line bg-surface p-5 sm:p-6">
          <div className="space-y-4">
            <Field label="Item name" htmlFor="title">
              <Input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="6ft step ladder"
                maxLength={80}
                required
              />
            </Field>
            <Field
              label="Description"
              hint={`${description.length}/600`}
              htmlFor="description"
            >
              <Textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Aluminium, folds flat, still has the little tray for screws. Good for ceiling lights and curtain rods."
                maxLength={600}
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category" htmlFor="category">
                <Select
                  id="category"
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value as CategoryId)
                  }
                >
                  {CATEGORIES.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Condition" htmlFor="condition">
                <Select
                  id="condition"
                  value={condition}
                  onChange={(event) =>
                    setCondition(event.target.value as ConditionId)
                  }
                >
                  {CONDITIONS.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            {error ? (
              <p className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-[12px] leading-5 text-danger">
                {error}
              </p>
            ) : null}
            <div className="flex items-center justify-between gap-3 border-t border-line pt-5">
              <p className="max-w-[230px] text-[10px] leading-4 text-muted">
                You can pause a listing at any time. Contact details stay
                private until you approve a request.
              </p>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                Add to shelf
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
