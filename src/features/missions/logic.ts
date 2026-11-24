export function attendanceDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function monthCells(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const leading = (first.getDay() + 6) % 7;
  return Array.from({ length: Math.ceil((leading + days) / 7) * 7 }, (_, index) => {
    const day = index - leading + 1;
    return day < 1 || day > days ? null : new Date(month.getFullYear(), month.getMonth(), day);
  });
}

export function attendanceStreak(dates: Set<string>, now: Date) {
  const day = new Date(now);
  if (!dates.has(attendanceDate(day))) day.setDate(day.getDate() - 1);
  let count = 0;
  while (dates.has(attendanceDate(day))) {
    count += 1;
    day.setDate(day.getDate() - 1);
  }
  return count;
}
