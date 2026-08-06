import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Props = {
  eyebrow: string;
  name: string;
  price: string;
  description: string;
  selected: boolean;
  detailsHref: string;
  onSelect: () => void;
};

const TierCard = ({ eyebrow, name, price, description, selected, detailsHref, onSelect }: Props) => {
  return (
    <Card
      data-selected={selected}
      className={cn(
        "relative flex-1 gap-0 rounded-lg border-2 border-input py-0 shadow-[0_0_10px_rgba(0,0,0,0.1)]",
        selected && "border-primary"
      )}
    >
      {selected && (
        <span className="pointer-events-none absolute top-4 right-4 z-10 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-3" />
        </span>
      )}
      <button
        type="button"
        onClick={onSelect}
        aria-label={`Select ${name}`}
        className="absolute inset-0 z-0 w-full rounded-[inherit] outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <CardHeader className="pointer-events-none gap-1 px-4 pt-4 pb-2.5 text-left">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {eyebrow}
        </span>
        <CardTitle className="text-lg font-semibold text-primary">{name}</CardTitle>
      </CardHeader>
      <CardContent className="pointer-events-none rounded-b-[inherit] bg-muted px-4 py-4 text-left">
        <p className="text-sm font-semibold text-foreground">{price}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
        <a
          href={detailsHref}
          target="_blank"
          rel="noreferrer"
          className="pointer-events-auto relative z-10 mt-1 inline-block text-xs text-link underline underline-offset-2 hover:text-primary"
        >
          View full tier details
        </a>
      </CardContent>
    </Card>
  );
};

export default TierCard;
