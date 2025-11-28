import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface DateFiltersProps {
  onDateChange: (startDate: Date, endDate?: Date) => void;
  currentDate: Date;
}

export default function DateFilters({ onDateChange, currentDate }: DateFiltersProps) {
  const [dateRange, setDateRange] = useState<{ from: Date; to?: Date }>({ from: currentDate });

  const handleQuickFilter = (type: string) => {
    const today = new Date();
    
    switch (type) {
      case "yesterday":
        const yesterday = subDays(today, 1);
        onDateChange(yesterday);
        break;
      case "today":
        onDateChange(today);
        break;
      case "tomorrow":
        const tomorrow = addDays(today, 1);
        onDateChange(tomorrow);
        break;
      case "week":
        onDateChange(startOfWeek(today, { locale: ptBR }), endOfWeek(today, { locale: ptBR }));
        break;
      case "month":
        onDateChange(startOfMonth(today), endOfMonth(today));
        break;
      case "year":
        onDateChange(startOfYear(today), endOfYear(today));
        break;
    }
  };

  const handleMonthSelect = (monthIndex: number) => {
    const year = currentDate.getFullYear();
    const month = monthIndex;
    const start = new Date(year, month, 1);
    const end = endOfMonth(start);
    onDateChange(start, end);
  };

  const handleYearSelect = (year: number) => {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    onDateChange(start, end);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros de Data</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros rápidos */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleQuickFilter("yesterday")}
          >
            Ontem
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleQuickFilter("today")}
          >
            Hoje
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleQuickFilter("tomorrow")}
          >
            Amanhã
          </Button>
        </div>

        {/* Filtros de período */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleQuickFilter("week")}
          >
            Semana Atual
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleQuickFilter("month")}
          >
            Mês Atual
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleQuickFilter("year")}
          >
            Ano Atual
          </Button>
        </div>

        {/* Seleção de mês e ano */}
        <div className="grid grid-cols-2 gap-2">
          <Select onValueChange={(value) => handleMonthSelect(parseInt(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar mês" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={(value) => handleYearSelect(parseInt(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar ano" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Intervalo personalizado */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                  </>
                ) : (
                  format(dateRange.from, "dd/MM/yyyy")
                )
              ) : (
                <span>Intervalo personalizado</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={(range: any) => {
                setDateRange(range || { from: currentDate });
                if (range?.from) {
                  onDateChange(range.from, range.to);
                }
              }}
              locale={ptBR}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </CardContent>
    </Card>
  );
}
