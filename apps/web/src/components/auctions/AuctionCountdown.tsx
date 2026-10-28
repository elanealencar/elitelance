
"use client";

import { useEffect, useState } from "react";

type AuctionCountdownProps = {
  endsAt: string;
};

function getRemainingTime(endsAt: string) {
  const difference = Math.max(
    0,
    new Date(endsAt).getTime() - Date.now()
  );

  const days = Math.floor(difference / 86_400_000);
  const hours = Math.floor((difference / 3_600_000) % 24);
  const minutes = Math.floor((difference / 60_000) % 60);
  const seconds = Math.floor((difference / 1000) % 60);

  return { days, hours, minutes, seconds, finished: difference === 0 };
}

export function AuctionCountdown({
  endsAt,
}: AuctionCountdownProps) {
  const [remaining, setRemaining] = useState<
    ReturnType<typeof getRemainingTime> | null
  >(null);

  useEffect(() => {
    const update = () => setRemaining(getRemainingTime(endsAt));

    update();

    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, [endsAt]);

  if (!remaining) {
    return (
      <span className="text-sm text-muted">
        Calculando tempo restante...
      </span>
    );
  }

  if (remaining.finished) {
    return (
      <span className="text-sm font-semibold text-muted">
        Tempo encerrado
      </span>
    );
  }

  const pad = (value: number) => String(value).padStart(2, "0");

  return (
    <span className="font-mono text-lg font-bold tabular-nums text-primary">
      {remaining.days > 0 && `${remaining.days}d `}
      {pad(remaining.hours)}:{pad(remaining.minutes)}:
      {pad(remaining.seconds)}
    </span>
  );
}
