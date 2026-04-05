import { cn } from "@/lib/utils";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: AvatarSize;
  className?: string;
}

const sizeMap: Record<AvatarSize, { box: string; text: string; img: string }> = {
  xs: { box: "h-6 w-6",  text: "text-[10px]", img: "24" },
  sm: { box: "h-8 w-8",  text: "text-xs",     img: "32" },
  md: { box: "h-10 w-10", text: "text-sm",    img: "40" },
  lg: { box: "h-14 w-14", text: "text-xl",    img: "56" },
  xl: { box: "h-20 w-20", text: "text-3xl",   img: "80" },
};

/** Deterministic pastel background for the initials fallback based on name */
function avatarColor(name: string): string {
  const colors = [
    "bg-brand-100 text-brand-700 border-brand-200",
    "bg-blue-100 text-blue-700 border-blue-200",
    "bg-purple-100 text-purple-700 border-purple-200",
    "bg-amber-100 text-amber-700 border-amber-200",
    "bg-rose-100 text-rose-700 border-rose-200",
    "bg-teal-100 text-teal-700 border-teal-200",
    "bg-orange-100 text-orange-700 border-orange-200",
    "bg-indigo-100 text-indigo-700 border-indigo-200",
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function Avatar({ name, avatarUrl, size = "md", className }: AvatarProps) {
  const { box, text } = sizeMap[size];

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        className={cn(
          "rounded-full object-cover border border-gray-200 flex-shrink-0",
          box,
          className
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border font-bold flex-shrink-0 select-none",
        box,
        text,
        avatarColor(name),
        className
      )}
      aria-label={name}
    >
      {initials(name)}
    </span>
  );
}
