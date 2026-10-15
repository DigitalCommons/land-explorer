import { PropsWithChildren } from "react";
import { Button } from "../ui/button";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "@/lib/utils";

export const Menu = ({children, className}: PropsWithChildren<{ className?: string }>) => {
  return (<div className={cn("flex flex-col bg-muted p-4 gap-2 -my-4 -ml-4", className)}>
    {children}
  </div>);
}

export const MenuHeader = ({children}: PropsWithChildren) => {
  return (
    <div className="flex text-base items-center gap-2 text-primary">
      {children}
    </div>
  )
}

export const MenuContent = ({children}: PropsWithChildren)=> {
 return (
    <div className="flex flex-col w-full text-md text-foreground items-center gap-1 ">
      {children}
    </div>
  )
}

type MenuItemProps = ButtonPrimitive.Props & { active?: boolean };
export const MenuItem = ({ active, className, ...props }: MenuItemProps) => {
  return (
     <Button variant="secondary" aria-current={active || undefined} className={cn(
      "flex justify-start w-full hover:bg-background",
      active && "bg-background",
      className,)} {...props}/>     
  )
}

