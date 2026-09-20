/**
 * daysUntilExam: positive integer
 * totalHoursNeeded: positive number (estimated hours to cover syllabus)
 * availableHoursPerDay: positive number (realistic hours/day the student can study)
 */
export function planStudyHours(daysUntilExam, totalHoursNeeded, availableHoursPerDay) {
  const days = Number(daysUntilExam);
  const hoursNeeded = Number(totalHoursNeeded);
  const hoursPerDay = Number(availableHoursPerDay);

  if (!Number.isFinite(days) || days <= 0) throw new Error("Days until exam must be a positive number.");
  if (!Number.isFinite(hoursNeeded) || hoursNeeded <= 0) throw new Error("Total study hours needed must be a positive number.");
  if (!Number.isFinite(hoursPerDay) || hoursPerDay <= 0) throw new Error("Available hours per day must be a positive number.");

  const requiredHoursPerDay = Number((hoursNeeded / days).toFixed(2));
  const totalAvailableHours = Number((days * hoursPerDay).toFixed(2));
  const feasible = requiredHoursPerDay <= hoursPerDay;
  const shortfallHours = feasible ? 0 : Number((hoursNeeded - totalAvailableHours).toFixed(2));

  return { requiredHoursPerDay, totalAvailableHours, feasible, shortfallHours };
}
