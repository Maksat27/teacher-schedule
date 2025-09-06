import { useState, useEffect, useRef, useCallback } from "react";
import {
  parseISO,
  format,
  eachDayOfInterval,
  differenceInMinutes,
} from "date-fns";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

function TeacherCalendar({ schedule = [], lessons = [], onSlotSelect }) {
  const VISIBLE_START_HOUR = 0;
  const VISIBLE_END_HOUR = 24;
  const GRANULARITY_MINUTES = 30;
  const SLOT_MS = GRANULARITY_MINUTES * 60_000;
  const MIN_LAST_DATE = new Date("2025-09-05T23:59:59");
  const ROW_HEIGHT = 40;

  // ----------------------------
  // 1. Date range
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
  // 2. Responsive view
  // ----------------------------
  const getViewFromWidth = (w) => {
    if (w <= 640) return "day";
    if (w <= 1024) return "3-day";
    return "week";
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
  // 3. Paging
  // ----------------------------
  const [pageIndex, setPageIndex] = useState(0);
  const totalPages = Math.max(1, Math.ceil(allDays.length / weekSize));
  const startIdx = pageIndex * weekSize;
  const endIdx = Math.min(startIdx + weekSize, allDays.length);
  const currentDays = allDays.slice(startIdx, endIdx);

  const headerTitle = currentDays.length
    ? `${format(currentDays[0], "d MMM")} - ${format(
        currentDays[currentDays.length - 1],
        "d MMM"
      )}`
    : "";

  // ----------------------------
  // 4. Time slots
  // ----------------------------
  const generateTimeSlots = (startHour, endHour, step) => {
    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += step) {
        slots.push({ hour, minute });
      }
    }
    return slots;
  };
  const timeSlots = generateTimeSlots(
    VISIBLE_START_HOUR,
    VISIBLE_END_HOUR,
    GRANULARITY_MINUTES
  );

  // ----------------------------
  // Helpers
  // ----------------------------
  const overlaps = (aStart, aEnd, bStart, bEnd) =>
    aStart < bEnd && bStart < aEnd;

  const slotOverlapsSchedule = (slotStart, slotEnd) =>
    schedule.some((s) => {
      const sStart = parseISO(s.startTime);
      const sEnd = parseISO(s.endTime);
      return overlaps(slotStart, slotEnd, sStart, sEnd);
    });

  // Compute lessons as blocks with precise positions
  const lessonBlocks = [];
  lessons.forEach((lesson) => {
    const lStart = parseISO(lesson.startTime);
    const lEnd = parseISO(lesson.endTime);

    currentDays.forEach((day, dayIdx) => {
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const overlapStart = Math.max(lStart.getTime(), dayStart.getTime());
      const overlapEnd = Math.min(lEnd.getTime(), dayEnd.getTime());
      if (overlapEnd <= overlapStart) return;

      const startMinutes = (overlapStart - dayStart.getTime()) / 60000;
      const durationMinutes = (overlapEnd - overlapStart) / 60000;

      lessonBlocks.push({
        lesson,
        dayIdx,
        startMinutes,
        durationMinutes,
        overlapStart,
        overlapEnd,
      });
    });
  });

  // ----------------------------
  // Column position measurement
  // ----------------------------
  const dayRefs = useRef([]);
  const [columnPositions, setColumnPositions] = useState([]);

  const updateColumnPositions = useCallback(() => {
    const positions = dayRefs.current.map((el) =>
      el ? { left: el.offsetLeft, width: el.offsetWidth } : null
    );
    if (positions.every((p) => p !== null)) {
      setColumnPositions(positions);
    }
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => updateColumnPositions(), 100);
    return () => clearTimeout(debounce);
  }, [currentDays, view, updateColumnPositions]);

  useEffect(() => {
    const handleResize = () => updateColumnPositions();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateColumnPositions]);

  // ----------------------------
  // Render
  // ----------------------------
  return (
    <div className="p-8 shadow-xl rounded">
      {/* Header */}
      <div className="flex justify-between items-stretch bg-blue-400 text-white h-12">
        <button
          onClick={() => setPageIndex((p) => Math.max(p - 1, 0))}
          disabled={pageIndex === 0}
          className="flex items-center justify-center px-4 hover:bg-blue-500 disabled:opacity-50"
        >
          <FaChevronLeft />
        </button>

        <div className="flex items-center text-xl font-bold">{headerTitle}</div>

        <button
          onClick={() => setPageIndex((p) => Math.min(p + 1, totalPages - 1))}
          disabled={pageIndex >= totalPages - 1}
          className="flex items-center justify-center px-4 hover:bg-blue-500 disabled:opacity-50"
        >
          <FaChevronRight />
        </button>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto relative">
        <div
          className="grid border text-sm relative"
          style={{
            gridTemplateColumns: `80px repeat(${currentDays.length}, minmax(140px, 1fr))`,
            gridAutoRows: `${ROW_HEIGHT}px`,
          }}
        >
          {/* Header Row */}
          <div className="border p-2 bg-white">Time</div>
          {currentDays.map((date, i) => (
            <div
              key={i}
              ref={(el) => (dayRefs.current[i] = el)}
              className="border  text-center bg-white"
            >
              <div className="font-bold">{format(date, "EEE")}</div>
              <div>{format(date, "d MMM")}</div>
            </div>
          ))}

          {/* Time Rows */}
          {timeSlots.map((slot, rIdx) => {
            const timeLabel = `${String(slot.hour).padStart(2, "0")}:${String(
              slot.minute
            ).padStart(2, "0")}`;
            return (
              <div key={`time-${rIdx}`} className="contents">
                <div className="border p-2 text-xs bg-white">{timeLabel}</div>
                {currentDays.map((day, cIdx) => {
                  const slotStart = new Date(day);
                  slotStart.setHours(slot.hour, slot.minute, 0, 0);
                  const slotEnd = new Date(slotStart.getTime() + SLOT_MS);

                  const available = slotOverlapsSchedule(slotStart, slotEnd);
                  return (
                    <div
                      key={`cell-${rIdx}-${cIdx}`}
                      className={`border p-2 ${
                        available
                          ? "bg-green-200 cursor-pointer"
                          : "bg-gray-100"
                      } hover:brightness-95`}
                      onClick={() =>
                        available &&
                        onSlotSelect &&
                        onSlotSelect({ startTime: slotStart, endTime: slotEnd })
                      }
                    />
                  );
                })}
              </div>
            );
          })}

          {/* Lessons Overlay (absolute positioned) */}
          {lessonBlocks.map((block, i) => {
            const {
              lesson,
              dayIdx,
              startMinutes,
              durationMinutes,
              overlapStart,
              overlapEnd,
            } = block;
            const pos = columnPositions[dayIdx];
            if (!pos) return null;

            const top =
              ROW_HEIGHT + (startMinutes / GRANULARITY_MINUTES) * ROW_HEIGHT;
            const height = (durationMinutes / GRANULARITY_MINUTES) * ROW_HEIGHT;
            const duration = Math.round(durationMinutes);

            return (
              <div
                key={i}
                className="absolute rounded-md p-2 text-white text-xs font-bold"
                style={{
                  left: `${pos.left}px`,
                  width: `${pos.width}px`,
                  top: `${top}px`,
                  height: `${height}px`,
                  backgroundColor: "#f87171",
                  zIndex: 10,
                  cursor: "pointer",
                }}
                onClick={() =>
                  alert(
                    `${lesson.student ?? "Lesson"} • ${duration} min\n${format(
                      new Date(overlapStart),
                      "HH:mm"
                    )} - ${format(new Date(overlapEnd), "HH:mm")}`
                  )
                }
              >
                <div>{lesson.student ?? "Lesson"}</div>
                <div>
                  {format(new Date(overlapStart), "HH:mm")} -{" "}
                  {format(new Date(overlapEnd), "HH:mm")}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TeacherCalendar;
