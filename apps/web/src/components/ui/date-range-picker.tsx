"use client"

import * as React from "react"
import { format, subDays, startOfMonth, endOfMonth } from "date-fns"
import { id } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerWithRangeProps extends React.HTMLAttributes<HTMLDivElement> {
  date: DateRange | undefined
  setDate: (date: DateRange | undefined) => void
}

export function DatePickerWithRange({
  className,
  date,
  setDate,
}: DatePickerWithRangeProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handlePresetClick = (preset: 'today' | 'last7' | 'thisMonth') => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let from = today;
    let to = today;

    if (preset === 'last7') {
      from = subDays(today, 6);
    } else if (preset === 'thisMonth') {
      from = startOfMonth(today);
      to = endOfMonth(today);
    }

    setDate({ from, to });
    setIsOpen(false); // Auto close after preset
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[260px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd MMM yyyy", { locale: id })} -{" "}
                  {format(date.to, "dd MMM yyyy", { locale: id })}
                </>
              ) : (
                format(date.from, "dd MMM yyyy", { locale: id })
              )
            ) : (
              <span>Pilih tanggal</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 flex flex-col md:flex-row" align="end">
          <div className="flex flex-col gap-2 p-3 border-b md:border-b-0 md:border-r border-border">
            <span className="text-xs font-semibold uppercase text-muted-foreground mb-1">Pilih Cepat</span>
            <Button variant="ghost" className="justify-start text-sm h-8" onClick={() => handlePresetClick('today')}>
              Hari Ini
            </Button>
            <Button variant="ghost" className="justify-start text-sm h-8" onClick={() => handlePresetClick('last7')}>
              7 Hari Terakhir
            </Button>
            <Button variant="ghost" className="justify-start text-sm h-8" onClick={() => handlePresetClick('thisMonth')}>
              Bulan Ini
            </Button>
          </div>
          <div className="p-3">
            <Calendar
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={1}
              locale={id}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
