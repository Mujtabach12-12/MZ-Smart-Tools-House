/**
 * dob, asOf: "YYYY-MM-DD" strings.
 * Returns { years, months, days, totalDays }
 */
export function calculateAge(dob, asOf) {
  const dobDate = new Date(`${dob}T00:00:00`);
  const asOfDate = asOf ? new Date(`${asOf}T00:00:00`) : new Date(new Date().toDateString());

  if (Number.isNaN(dobDate.getTime())) throw new Error("Please provide a valid date of birth.");
  if (Number.isNaN(asOfDate.getTime())) throw new Error("Please provide a valid reference date.");
  if (dobDate > asOfDate) throw new Error("Date of birth cannot be in the future relative to the reference date.");

  let years = asOfDate.getFullYear() - dobDate.getFullYear();
  let months = asOfDate.getMonth() - dobDate.getMonth();
  let days = asOfDate.getDate() - dobDate.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(asOfDate.getFullYear(), asOfDate.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalDays = Math.round((asOfDate - dobDate) / (1000 * 60 * 60 * 24));

  return { years, months, days, totalDays };
}
