import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type AccordionType = "single" | "multiple";

interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: AccordionType;
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  collapsible?: boolean;
}

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const AccordionContext = React.createContext<
  | {
      type: AccordionType;
      value: string | string[];
      toggleItem: (itemValue: string) => void;
      collapsible: boolean;
    }
  | null
>(null);

const AccordionItemContext = React.createContext<string | null>(null);

function isItemOpen(value: string | string[], itemValue: string, type: AccordionType) {
  return type === "multiple"
    ? Array.isArray(value) && value.includes(itemValue)
    : value === itemValue;
}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  (
    {
      type = "single",
      defaultValue,
      value,
      onValueChange,
      collapsible = false,
      className,
      ...props
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = React.useState<string | string[]>(
      value ?? defaultValue ?? (type === "multiple" ? [] : ""),
    );

    React.useEffect(() => {
      if (value !== undefined) {
        setInternalValue(value);
      }
    }, [value]);

    const currentValue = value !== undefined ? value : internalValue;

    const toggleItem = (itemValue: string) => {
      const nextValue =
        type === "multiple"
          ? Array.isArray(currentValue)
            ? currentValue.includes(itemValue)
              ? currentValue.filter((item) => item !== itemValue)
              : [...currentValue, itemValue]
            : [itemValue]
          : currentValue === itemValue
          ? collapsible
            ? ""
            : currentValue
          : itemValue;

      if (value === undefined) {
        setInternalValue(nextValue);
      }

      onValueChange?.(nextValue);
    };

    return (
      <AccordionContext.Provider value={{ type, value: currentValue, toggleItem, collapsible }}>
        <div ref={ref} className={cn("space-y-2", className)} {...props} />
      </AccordionContext.Provider>
    );
  },
);
Accordion.displayName = "Accordion";

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ className, value, children, ...props }, ref) => (
    <AccordionItemContext.Provider value={value}>
      <div ref={ref} className={cn("border-b", className)} {...props}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  ),
);
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(AccordionContext);
    const itemValue = React.useContext(AccordionItemContext);

    if (!context || itemValue === null) {
      return null;
    }

    const open = isItemOpen(context.value, itemValue, context.type);

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => context.toggleItem(itemValue)}
        className={cn(
          "flex w-full items-center justify-between py-4 text-sm font-medium text-left transition-all hover:underline [&>svg]:transition-transform duration-200",
          open ? "[&>svg]:rotate-180" : "",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
      </button>
    );
  },
);
AccordionTrigger.displayName = "AccordionTrigger";

const AccordionContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(AccordionContext);
    const itemValue = React.useContext(AccordionItemContext);

    if (!context || itemValue === null) {
      return null;
    }

    const open = isItemOpen(context.value, itemValue, context.type);

    return (
      <div
        ref={ref}
        className={cn(
          "overflow-hidden text-sm transition-all duration-200",
          open ? "max-h-screen animate-accordion-down" : "max-h-0 animate-accordion-up",
          className,
        )}
        aria-hidden={!open}
        {...props}
      >
        <div className={cn("pb-4 pt-0", className)}>{children}</div>
      </div>
    );
  },
);
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
