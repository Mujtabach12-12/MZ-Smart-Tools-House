/**
 * daysUntilExam: positive number
 * totalHoursNeeded: zero or positive number
 * availableHoursPerDay: optional positive number used only for feasibility
 */
export function planStudyHours(daysUntilExam, totalHoursNeeded, availableHoursPerDay = "") {
  const days = Number(daysUntilExam);
  const hoursNeeded = Number(totalHoursNeeded);
  const hasAvailability = String(availableHoursPerDay ?? "").trim() !== "";
  const hoursPerDay = hasAvailability ? Number(availableHoursPerDay) : null;

  if (!Number.isFinite(days) || days <= 0) throw new Error("Days available must be greater than 0.");
  if (!Number.isFinite(hoursNeeded) || hoursNeeded < 0) throw new Error("Total study workload must be 0 or a positive number of hours.");
  if (days > 1e9 || hoursNeeded > 1e9) throw new Error("The entered study plan is too large to calculate safely.");
  if (hasAvailability && (!Number.isFinite(hoursPerDay) || hoursPerDay <= 0)) {
    throw new Error("Available hours per day must be greater than 0 when provided.");
  }
  if (hasAvailability && hoursPerDay > 1e9) throw new Error("Available hours per day is too large to calculate safely.");

  const requiredHoursPerDay = hoursNeeded / days;

  if (!hasAvailability) {
    return {
      requiredHoursPerDay,
      totalAvailableHours: null,
      feasible: null,
      shortfallHours: null,
    };
  }

  const totalAvailableHours = days * hoursPerDay;
  const feasible = requiredHoursPerDay <= hoursPerDay;
  const shortfallHours = feasible ? 0 : Math.max(0, hoursNeeded - totalAvailableHours);

  return { requiredHoursPerDay, totalAvailableHours, feasible, shortfallHours };
}
