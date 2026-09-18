import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Legacy SCSS classes (e.g. text-input) collide by name with Tailwind's own
// text-color utilities now that "input" is a theme color, so tailwind-merge
// treats them as conflicting and drops all but the last one. Registering them
// under their own group keeps them from being merged away.
const twMerge = extendTailwindMerge<
  "legacy-text-input" | "legacy-text-input-half" | "legacy-text-input-first-half"
>({
  extend: {
    classGroups: {
      "legacy-text-input": ["text-input"],
      "legacy-text-input-half": ["text-input-half"],
      "legacy-text-input-first-half": ["text-input-first-half"],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
