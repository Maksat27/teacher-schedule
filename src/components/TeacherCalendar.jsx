import { useState, useEffect } from "react";
import { parseISO, format, eachDayOfInterval } from "date-fns";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

function TeacherCalendar({ schedule = [], lessons = [], onSlotSelect }) {
  // ----------------------------
  // Settings
  // ----------------------------
  const VISIBLE_START_HOUR = 0;
  const VISIBLE_END_HOUR = 24;
  const GRANULARITY_MINUTES = 30;
  const SLOT_MS = GRANULARITY_MINUTES * 60_000;
  const MIN_LAST_DATE = new Date("2025-09-05T23:59:59");

  // ----------------------------
  // 1. build day range (from schedule start -> at least MIN_LAST_DATE)
  // ----------------------------
  const firstDate = schedule.length
    ? parseISO(schedule[0].startTime)
    : new Date();
  const lastFromSchedule = schedule.length
    ? parseISO(schedule[schedule.length - 1].endTime)
    : new Date();
  const lastDate = new Date(
    Math.max(lastFromSchedule.getTime(), MIN_LAST_DATE.getTime())
  );
  const allDays = eachDayOfInterval({ start: firstDate, end: lastDate });

  // ----------------------------
  // 2. responsive view detection
  // ----------------------------
  const getViewFromWidth = (w) => {
    if (w <= 640) return "day"; // mobile
    if (w <= 1024) return "3-day"; // tablet
    return "week"; // desktop
  };

  const [view, setView] = useState(() =>
    getViewFromWidth(typeof window !== "undefined" ? window.innerWidth : 1200)
  );

  useEffect(() => {
    const onResize = () => setView(getViewFromWidth(window.innerWidth));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const weekSize = view === "week" ? 7 : view === "3-day" ? 3 : 1;

  // ----------------------------
  // 3. paging (Next / Prev)
  // ----------------------------
  const [pageIndex, setPageIndex] = useState(0);
  const totalPages = Math.max(1, Math.ceil(allDays.length / weekSize));
  const startIdx = pageIndex * weekSize;
  const endIdx = Math.min(startIdx + weekSize, allDays.length);
  const currentDays = allDays.slice(startIdx, endIdx);

  // header title guard
  const headerTitle = currentDays.length
    ? `${format(currentDays[0], "d MMM")} - ${format(
        currentDays[currentDays.length - 1],
        "d MMM"
      )}`
    : "";

  // ----------------------------
  // 4. time slots generation
  // ----------------------------
  const generateTimeSlots = (
    startHour = VISIBLE_START_HOUR,
    endHour = VISIBLE_END_HOUR,
    step = GRANULARITY_MINUTES
  ) => {
    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += step) {
        slots.push({ hour, minute });
      }
    }
    return slots;
  };
  const timeSlots = generateTimeSlots();

  // ----------------------------
  // 5. helpers (overlap checks)
  // ----------------------------
  const overlaps = (aStart, aEnd, bStart, bEnd) =>
    aStart < bEnd && bStart < aEnd;

  const slotOverlapsSchedule = (slotStart, slotEnd) =>
    schedule.some((s) => {
      const sStart = parseISO(s.startTime);
      const sEnd = parseISO(s.endTime);
      return overlaps(slotStart, slotEnd, sStart, sEnd);
    });

  const slotOverlapsLesson = (slotStart, slotEnd) =>
    lessons.find((l) => {
      const lStart = parseISO(l.startTime);
      const lEnd = parseISO(l.endTime);
      return overlaps(slotStart, slotEnd, lStart, lEnd);
    });

  // ----------------------------
  // 6. handlers
  // ----------------------------
  const handleNext = () => setPageIndex((p) => Math.min(p + 1, totalPages - 1));
  const handlePrev = () => setPageIndex((p) => Math.max(p - 1, 0));

  // ----------------------------
  // 7. render
  // ----------------------------
  return (
    <div className="m-4 shadow-xl rounded">
      {/* Header */}
      <div className="flex justify-between items-stretch bg-blue-400 text-white h-12">
        <button
          onClick={handlePrev}
          disabled={pageIndex === 0}
          className="flex items-center justify-center px-4 hover:bg-blue-500 disabled:opacity-50"
        >
          <FaChevronLeft />
        </button>

        <div className="flex items-center text-xl font-bold">{headerTitle}</div>

        <button
          onClick={handleNext}
          disabled={pageIndex >= totalPages - 1}
          className="flex items-center justify-center px-4 hover:bg-blue-500 disabled:opacity-50"
        >
          <FaChevronRight />
        </button>
      </div>

      {/* Grid: time column + N day columns. We use inline style for gridTemplateColumns */}
      <div
        className="overflow-x-auto"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div
          className="grid border text-sm"
          style={{
            gridTemplateColumns: `80px repeat(${currentDays.length}, minmax(140px, 1fr))`,
          }}
        >
          {/* Days header */}
          <div className="border p-2 bg-white">Time</div>
          {currentDays.map((date, i) => (
            <div key={i} className="border p-2 text-center bg-white">
              <div className="font-bold">{format(date, "EEE")}</div>
              <div>{format(date, "d MMM")}</div>
            </div>
          ))}

          {/* For each time slot -> render the row (time cell + day cells) */}
          {timeSlots.map((slot, rIdx) => {
            // time label cell (one per row)
            const timeLabel = `${String(slot.hour).padStart(2, "0")}:${String(
              slot.minute
            ).padStart(2, "0")}`;

            // return a fragment of row cells: first column then each day column
            return (
              // we use key `${rIdx}` and render row cells sequentially
              <div key={`time-${rIdx}`} className="contents">
                {/* Time column */}
                <div className="border p-2 text-xs bg-white">{timeLabel}</div>

                {/* Day columns */}
                {currentDays.map((day, cIdx) => {
                  // build slot start and end for this specific day cell
                  const slotStart = new Date(day);
                  slotStart.setHours(slot.hour, slot.minute, 0, 0);
                  const slotEnd = new Date(slotStart.getTime() + SLOT_MS);

                  const lesson = slotOverlapsLesson(slotStart, slotEnd);
                  const available = slotOverlapsSchedule(slotStart, slotEnd);

                  let bgClass = "bg-gray-100";
                  if (lesson) bgClass = "bg-red-300 cursor-pointer";
                  else if (available) bgClass = "bg-green-200 cursor-pointer";

                  return (
                    <div
                      key={`cell-${rIdx}-${cIdx}`}
                      className={`border p-2 text-center ${bgClass} hover:brightness-95`}
                      onClick={() => {
                        if (lesson) {
                          // show user-friendly date/time (no timezone)
                          const startLabel = format(
                            parseISO(lesson.startTime),
                            "d MMM, HH:mm"
                          );
                          const endLabel = lesson.endTime
                            ? format(parseISO(lesson.endTime), "d MMM, HH:mm")
                            : "";
                          alert(
                            `${lesson.student ?? "Lesson"} • ${
                              lesson.duration
                            }m\n${startLabel}${
                              endLabel ? " - " + endLabel : ""
                            }`
                          );
                        } else if (available && onSlotSelect) {
                          onSlotSelect({
                            startTime: slotStart,
                            endTime: slotEnd,
                          });
                        }
                      }}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TeacherCalendar;
