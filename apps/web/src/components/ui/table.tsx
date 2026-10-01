"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        "bg-slate-50/70 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200/80 dark:border-slate-800 [&_tr]:border-b-0 [&_tr]:bg-transparent [&_tr]:hover:bg-transparent",
        className
      )}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0 divide-y divide-slate-100 dark:divide-slate-800/80", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-slate-100 dark:border-slate-800/80 transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-950/25 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-blue-50/70 dark:data-[state=selected]:bg-blue-950/40",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "py-3.5 px-4 text-left align-middle font-semibold text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] [&_[role=checkbox]]:border-blue-300 dark:[&_[role=checkbox]]:border-blue-700 [&_[role=checkbox]]:bg-white dark:[&_[role=checkbox]]:bg-slate-900 [&_[role=checkbox][data-state=checked]]:bg-blue-600 [&_[role=checkbox][data-state=checked]]:text-white [&_[role=checkbox][data-state=checked]]:border-blue-600 [&_button]:text-slate-700 dark:[&_button]:text-slate-300 [&_button:hover]:text-blue-600 dark:[&_button:hover]:text-blue-400 [&_button:hover]:bg-blue-50 dark:[&_button:hover]:bg-blue-900/50 [&_svg]:text-slate-500 dark:[&_svg]:text-slate-400",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "py-3.5 px-4 align-middle text-xs whitespace-nowrap text-slate-700 dark:text-slate-300 [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
