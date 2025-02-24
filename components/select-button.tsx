"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Button, ButtonProps } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface SelectButtonContextType {
  variant: ButtonProps["variant"];
  selectedItem: string | null;
  setSelectedItem: (item: string | null) => void;
}

const SelectButtonContext = React.createContext<SelectButtonContextType | undefined>(undefined);

interface SelectButtonProps extends React.ComponentPropsWithoutRef<typeof DropdownMenu> {
  variant?: ButtonProps["variant"];
  defaultSelectedItem?: string | null;
}

const SelectButton = React.forwardRef<HTMLDivElement, SelectButtonProps>(
  ({ children, variant = "default", defaultSelectedItem = null, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [selectedItem, setSelectedItem] = React.useState<string | null>(defaultSelectedItem);

    return (
      <SelectButtonContext.Provider value={{ variant, selectedItem, setSelectedItem }}>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen} {...props}>
          <div ref={ref} className="inline-flex rounded-md shadow-xs">
            {children}
          </div>
        </DropdownMenu>
      </SelectButtonContext.Provider>
    );
  },
);
SelectButton.displayName = "SelectButton";

const SelectButtonContent = React.forwardRef<
  HTMLButtonElement,
  Omit<React.ComponentPropsWithoutRef<typeof Button>, "variant">
>(({ children, className, ...props }, ref) => {
  const context = React.useContext(SelectButtonContext);
  if (!context) throw new Error("SelectButtonContent must be used within a SelectButton");

  return (
    <Button ref={ref} variant={context.variant} className={`rounded-r-none ${className}`} {...props}>
      {context.selectedItem || children}
    </Button>
  );
});
SelectButtonContent.displayName = "SelectButtonContent";

const SelectButtonMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  Omit<React.ComponentPropsWithoutRef<typeof Button>, "variant">
>(({ children, className, ...props }, ref) => {
  const context = React.useContext(SelectButtonContext);
  if (!context) throw new Error("SelectButtonMenuTrigger must be used within a SelectButton");

  return (
    <DropdownMenuTrigger asChild>
      <Button ref={ref} variant={context.variant} className={`rounded-l-none border-l px-2 ${className}`} {...props}>
        {children}
      </Button>
    </DropdownMenuTrigger>
  );
});
SelectButtonMenuTrigger.displayName = "SelectButtonMenuTrigger";

const SelectButtonMenuContent = DropdownMenuContent;

interface SelectButtonMenuItemProps extends React.ComponentPropsWithoutRef<typeof DropdownMenuItem> {
  value: string;
}

const SelectButtonMenuItem = React.forwardRef<HTMLDivElement, SelectButtonMenuItemProps>(
  ({ children, value, onClick, ...props }, ref) => {
    const context = React.useContext(SelectButtonContext);
    if (!context) throw new Error("SelectButtonMenuItem must be used within a SelectButton");

    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
      context.setSelectedItem(value);
      onClick?.(event);
    };

    return (
      <DropdownMenuItem ref={ref} onClick={handleClick} {...props}>
        {children}
      </DropdownMenuItem>
    );
  },
);
SelectButtonMenuItem.displayName = "SelectButtonMenuItem";

const SelectButtonMenuSeparator = DropdownMenuSeparator;

export {
  SelectButton,
  SelectButtonContent,
  SelectButtonMenuTrigger,
  SelectButtonMenuContent,
  SelectButtonMenuItem,
  SelectButtonMenuSeparator,
};
