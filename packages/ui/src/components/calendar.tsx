"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { cn } from "../lib/utils";
import { buttonVariants } from "./button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 select-none", className)}
      classNames={{
        root: "relative",
        months: "flex flex-col sm:flex-row gap-4",
        month: "space-y-4",
        month_caption: "flex justify-center pt-1 relative items-center text-sm font-medium",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "absolute left-1 top-1 h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 z-10"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "absolute right-1 top-1 h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 z-10"
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex justify-between",
        weekday: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center",
        week: "flex w-full mt-2 justify-between",
        day: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal hover:bg-accent hover:text-accent-foreground rounded-md transition-colors flex items-center justify-center aria-selected:opacity-100"
        ),
        range_start: "day-range-start rounded-l-md",
        range_end: "day-range-end rounded-r-md",
        selected:
          "bg-primary text-primary-foreground font-semibold hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md",
        today: "bg-accent/40 font-semibold rounded-md",
        outside: "day-outside text-muted-foreground opacity-40 aria-selected:opacity-30",
        disabled: "text-muted-foreground opacity-30 pointer-events-none",
        range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground rounded-none",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClass, ...chevronProps }) => {
          if (orientation === "left") {
            return (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={cn("h-4 w-4", chevronClass)}
                {...chevronProps}
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            );
          }
          return (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn("h-4 w-4", chevronClass)}
              {...chevronProps}
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          );
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
