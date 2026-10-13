import { useEffect, useState } from "react";

type ZonedTime = { hours: number; minutes: number };

function read(timeZone: string): ZonedTime {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { hours: value("hour"), minutes: value("minute") };
}

/** Live wall-clock time for a city, updated on the minute boundary. */
export function useZonedClock(timeZone: string) {
  const [time, setTime] = useState<ZonedTime>(() => read(timeZone));
  useEffect(() => {
    let timer = 0;
    const schedule = () => {
      const now = new Date();
      const wait = (60 - now.getSeconds()) * 1000 - now.getMilliseconds() + 30;
      timer = window.setTimeout(() => {
        setTime(read(timeZone));
        schedule();
      }, wait);
    };
    setTime(read(timeZone));
    schedule();
    return () => window.clearTimeout(timer);
  }, [timeZone]);
  return time;
}
