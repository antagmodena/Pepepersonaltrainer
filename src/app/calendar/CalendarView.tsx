'use client';

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { it } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

interface TrainingCard {
  id: string;
  training_date: string;
  session_type: string;
  coach_feedback: string | null;
}

interface CalendarViewProps {
  trainingCards: TrainingCard[];
}

export default function CalendarView({ trainingCards }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const router = useRouter();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDay = monthStart.getDay();
  const emptyDays = startDay === 0 ? 6 : startDay - 1;

  const getCardsForDay = (date: Date) => {
    return trainingCards.filter(card => 
      isSameDay(new Date(card.training_date), date)
    );
  };

  const handleDayClick = (date: Date) => {
    const dayCards = getCardsForDay(date);
    const dateStr = format(date, 'yyyy-MM-dd');
    
    if (dayCards.length === 1) {
      // Se c'è una scheda, aprila
      router.push(`/training/${dayCards[0].id}`);
    } else if (dayCards.length > 1) {
      // Se ci sono più schede, vai alla lista filtrata
      router.push(`/training?date=${dateStr}`);
    } else {
      // Se non c'è nessuna scheda, crea una nuova con questa data
      router.push(`/training/new?date=${dateStr}`);
    }
  };

  const isToday = (date: Date) => isSameDay(date, new Date());
  const isPast = (date: Date) => date < new Date() && !isToday(date);
  const isFuture = (date: Date) => date > new Date();

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          className="p-2 hover:bg-[var(--color-light)] rounded-lg transition-all text-xl"
        >
          ←
        </button>
        <h2 className="text-lg font-bold text-[var(--color-dark-blue)] capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: it })}
        </h2>
        <button
          onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          className="p-2 hover:bg-[var(--color-light)] rounded-lg transition-all text-xl"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((day, i) => (
          <div key={i} className="text-center text-xs font-semibold text-[var(--color-gray)] py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: emptyDays }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {days.map(day => {
          const dayCards = getCardsForDay(day);
          const hasCards = dayCards.length > 0;
          const hasFeedback = dayCards.some(c => c.coach_feedback);

          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDayClick(day)}
              className={`aspect-square p-1 rounded-lg border-2 transition-all flex flex-col items-center justify-center
                ${isToday(day) 
                  ? 'border-[var(--color-azure)] bg-[var(--color-light)]' 
                  : 'border-transparent hover:border-[var(--color-light-gray)] hover:bg-[var(--color-light)]'
                }
                ${hasCards ? 'bg-blue-50' : ''}
              `}
            >
              <span className={`text-sm font-medium
                ${isToday(day) ? 'text-[var(--color-blue)]' : ''}
                ${isPast(day) && !hasCards ? 'text-[var(--color-gray)]' : 'text-[var(--color-dark-blue)]'}
              `}>
                {format(day, 'd')}
              </span>
              
              {hasCards && (
                <div className="flex gap-0.5 mt-0.5">
                  {dayCards.slice(0, 3).map((card, i) => (
                    <span 
                      key={i} 
                      className={`w-1.5 h-1.5 rounded-full ${
                        card.coach_feedback ? 'bg-green-500' : 'bg-[var(--color-azure)]'
                      }`}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-[var(--color-light-gray)]">
        <h3 className="font-semibold text-[var(--color-dark-blue)] mb-3 text-sm">Legenda</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-[var(--color-azure)] rounded-full"></span>
            <span>Scheda</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <span>Con feedback</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 border-2 border-[var(--color-azure)] rounded-full"></span>
            <span>Oggi</span>
          </div>
        </div>
      </div>
    </div>
  );
}
