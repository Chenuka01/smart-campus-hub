import { useState, useEffect } from 'react';
import { Clock, CheckCircle } from 'lucide-react';

interface BookingTimerProps {
  date: string;       // e.g., '2024-05-20'
  startTime: string;  // e.g., '14:00'
  endTime: string;    // e.g., '16:00'
  status: string;
}

export default function BookingTimer({ date, startTime, endTime, status }: BookingTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [timerStatus, setTimerStatus] = useState<'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'INVALID'>('INVALID');

  useEffect(() => {
    if (status !== 'APPROVED') return;

    if (!date || !startTime || !endTime) {
      setTimerStatus('INVALID');
      return;
    }

    const calculateTime = () => {
      // Robustly parse the date and time strings
      const parseDateTime = (dateStr: string, timeStr: string) => {
        // Normalize date to YYYY-MM-DD
        let ndStr = dateStr.replace(/\//g, '-');
        const dParts = ndStr.split('-');
        if (dParts.length === 3 && dParts[0].length <= 2) {
          // It's DD-MM-YYYY or DD/MM/YYYY, convert to YYYY-MM-DD
          ndStr = `${dParts[2]}-${dParts[1]}-${dParts[0]}`;
        }
        
        // Normalize time to HH:mm
        let ntStr = timeStr.trim();
        const isPM = /PM/i.test(ntStr);
        const isAM = /AM/i.test(ntStr);
        if (isPM || isAM) {
          const timeVal = ntStr.replace(/AM|PM/gi, '').trim();
          const tParts = timeVal.split(':');
          let h = parseInt(tParts[0] || '0', 10);
          if (isPM && h < 12) h += 12;
          if (isAM && h === 12) h = 0;
          ntStr = `${h.toString().padStart(2, '0')}:${tParts[1] || '00'}`;
        }
        
        // Extract just HH:mm to avoid appending seconds if they already exist
        const hhmm = ntStr.split(':').slice(0, 2).join(':');
        
        // Return timestamps
        return new Date(`${ndStr}T${hhmm}:00`).getTime();
      };

      const startDateTime = parseDateTime(date, startTime);
      const endDateTime = parseDateTime(date, endTime);
      const now = new Date().getTime();

      if (isNaN(startDateTime) || isNaN(endDateTime)) {
        setTimerStatus('INVALID');
        return;
      }

      if (now < startDateTime) {
        setTimerStatus('UPCOMING');
        const diff = startDateTime - now;
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      } else if (now >= startDateTime && now < endDateTime) {
        setTimerStatus('IN_PROGRESS');
      } else {
        setTimerStatus('COMPLETED');
      }
    };

    calculateTime();
    const intervalId = setInterval(calculateTime, 1000);

    return () => clearInterval(intervalId);
  }, [date, startTime, endTime, status]);

  if (status !== 'APPROVED' || timerStatus === 'INVALID') {
    return null;
  }

  if (timerStatus === 'UPCOMING' && timeLeft) {
    const { days, hours, minutes, seconds } = timeLeft;
    
    // Format the text
    const parts = [];
    if (days > 0) {
      parts.push(`${days} day${days > 1 ? 's' : ''}`);
      parts.push(`${hours.toString().padStart(2, '0')} hrs`);
      parts.push(`${minutes.toString().padStart(2, '0')} mins`);
    } else if (hours > 0) {
      parts.push(`${hours.toString().padStart(2, '0')} hrs`);
      parts.push(`${minutes.toString().padStart(2, '0')} mins`);
      parts.push(`${seconds.toString().padStart(2, '0')} secs`);
    } else if (minutes > 0) {
      parts.push(`${minutes} mins`);
      parts.push(`${seconds.toString().padStart(2, '0')} secs`);
    } else {
      parts.push(`${seconds} secs`);
    }

    return (
      <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
        <Clock className="w-3.5 h-3.5" />
        <span>Starts in {parts.join(' ')}</span>
      </div>
    );
  }

  if (timerStatus === 'IN_PROGRESS') {
    return (
      <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <span>In Progress</span>
      </div>
    );
  }

  if (timerStatus === 'COMPLETED') {
    return (
      <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-500/10 border border-slate-500/20 text-slate-400 text-xs font-medium">
        <CheckCircle className="w-3.5 h-3.5" />
        <span>Completed</span>
      </div>
    );
  }

  return null;
}
