import TeacherCalendar from "./components/TeacherCalendar";

function App() {
  const schedule = [
    {
      startTime: "2025-08-23T22:30:00+00:00",
      endTime: "2025-08-24T02:29:59+00:00",
    },
    {
      startTime: "2025-08-25T01:30:00+00:00",
      endTime: "2025-08-25T04:59:59+00:00",
    },
    {
      startTime: "2025-08-25T11:00:00+00:00",
      endTime: "2025-08-25T19:29:59+00:00",
    },
    {
      startTime: "2025-08-27T02:30:00+00:00",
      endTime: "2025-08-27T06:59:59+00:00",
    },
    {
      startTime: "2025-08-28T23:00:00+00:00",
      endTime: "2025-08-29T08:29:59+00:00",
    },
    {
      startTime: "2025-08-30T22:30:00+00:00",
      endTime: "2025-08-31T02:29:59+00:00",
    },
    {
      startTime: "2025-09-01T01:30:00+00:00",
      endTime: "2025-09-01T04:59:59+00:00",
    },
    {
      startTime: "2025-09-01T11:00:00+00:00",
      endTime: "2025-09-01T19:29:59+00:00",
    },
  ];

  const lessons = [
    {
      id: 1,
      duration: 60,
      startTime: "2025-08-25T09:00:00",
      endTime: "2025-08-25T10:00:00",
      student: "Alex",
    },
    {
      id: 2,
      duration: 90,
      startTime: "2025-08-27T03:00:00",
      endTime: "2025-08-27T04:30:00",
      student: "Sam",
    },
    {
      id: 3,
      duration: 90,
      startTime: "2025-08-28T23:30:00",
      endTime: "2025-08-29T01:00:00",
      student: "John",
    },
  ];

  return (
    <div className="max-w-full mx-auto">
      <h1 className="text-3xl font-bold m-12">Teacher Schedule</h1>
      <TeacherCalendar
        view="week"
        startDate={new Date("2025-08-25")}
        schedule={schedule}
        lessons={lessons}
        onSlotSelect={(slot) =>
          alert(
            `Selected slot: ${slot.startTime.toLocaleString([], {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}`
          )
        }
      />
    </div>
  );
}

export default App;
