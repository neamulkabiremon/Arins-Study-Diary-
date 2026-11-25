import { SunriseBanner } from "@/components/illustrations/Sunrise";
import { messageForDate } from "@/lib/messages";

export function MotivationalBanner({ dateStr }: { dateStr: string }) {
  const msg = messageForDate(dateStr);
  return (
    <figure className="relative overflow-hidden rounded-[1.35rem] border border-lavender-soft/80 bg-gradient-to-r from-[#f3eaf8] via-[#fff8f2] to-[#f8e9bc]/70 shadow-card">
      <div className="absolute inset-y-0 right-0 w-[38%] opacity-90 sm:w-44">
        <SunriseBanner className="h-full w-full" />
      </div>
      <blockquote className="relative z-10 px-5 py-5 pr-28 sm:px-6 sm:py-6">
        <p className="font-display text-lg italic leading-snug text-ink sm:text-xl">
          &ldquo;{msg.text}&rdquo;
        </p>
        <p className="mt-2 text-xs font-medium tracking-wide text-lavender-deep">
          {msg.source}
        </p>
        <figcaption className="mt-2.5 max-w-md text-sm leading-relaxed text-ink-muted">
          {msg.action}
        </figcaption>
      </blockquote>
    </figure>
  );
}
