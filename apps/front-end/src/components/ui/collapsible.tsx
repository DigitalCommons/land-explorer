import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible"

import { cn } from "@/lib/utils"

function Collapsible({ className, ...props }: CollapsiblePrimitive.Root.Props) {
  return (
    <CollapsiblePrimitive.Root
      data-slot="collapsible"
      className={cn("shadcn-scope", className)}
      {...props}
    />
  )
}

function CollapsibleTrigger({
  className,
  ...props
}: CollapsiblePrimitive.Trigger.Props) {
  return (
    <CollapsiblePrimitive.Trigger
      data-slot="collapsible-trigger"
      // Renders a <button>. Preflight does not match the scope root itself, so
      // reset the browser defaults here rather than relying on shadcn-scope.
      className={cn(
        "shadcn-scope box-border cursor-pointer border-0 bg-transparent p-0",
        className
      )}
      {...props}
    />
  )
}

function CollapsibleContent({
  className,
  ...props
}: CollapsiblePrimitive.Panel.Props) {
  return (
    <CollapsiblePrimitive.Panel
      data-slot="collapsible-content"
      className={cn(
        "shadcn-scope h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0",
        className
      )}
      {...props}
    />
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
