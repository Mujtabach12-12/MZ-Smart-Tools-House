const MAX_SAFE_FINANCE_VALUE = 1e15;
const COMPOUNDING = new Set([1, 2, 4, 12, 365]);

function readNumber(value, label) {
  if (value === '' || value === null || value === undefined) {
    throw new Error(`Please enter ${label}.`);
  }
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`${label} must be a valid number.`);
  if (Math.abs(number) > MAX_SAFE_FINANCE_VALUE) {
    throw new Error(`${label} is too large for a reliable browser calculation.`);
  }
  return number;
}

function nonNegative(value, label) {
  const number = readNumber(value, label);
  if (number < 0) throw new Error(`${label} cannot be negative.`);
  return number;
}

function positive(value, label) {
  const number = readNumber(value, label);
  if (number <= 0) throw new Error(`${label} must be greater than zero.`);
  return number;
}

function percent(value, label, { max = null } = {}) {
  const number = nonNegative(value, label);
  if (max !== null && number > max) throw new Error(`${label} cannot be greater than ${max}%.`);
  return number;
}

function ensureFinite(value, label = 'Result') {
  if (!Number.isFinite(value)) throw new Error(`${label} could not be calculated from these values.`);
  if (Math.abs(value) > Number.MAX_SAFE_INTEGER) {
    throw new Error(`${label} is too large to display reliably.`);
  }
  return value;
}

export const COMPOUNDING_OPTIONS = [
  { value: '1', label: 'Annually' },
  { value: '2', label: 'Semi-annually' },
  { value: '4', label: 'Quarterly' },
  { value: '12', label: 'Monthly' },
  { value: '365', label: 'Daily' },
];

export function simpleInterest({ principal, annualRate, years }) {
  const p = nonNegative(principal, 'Principal');
  const r = percent(annualRate, 'Annual interest rate') / 100;
  const t = nonNegative(years, 'Time in years');
  const interest = ensureFinite(p * r * t, 'Interest');
  return { interest, total: ensureFinite(p + interest, 'Total amount') };
}

export function compoundInterest({ principal, annualRate, years, compoundsPerYear = 1 }) {
  const p = nonNegative(principal, 'Principal');
  const ratePercent = percent(annualRate, 'Annual interest rate');
  const t = nonNegative(years, 'Time in years');
  const n = Number(compoundsPerYear);
  if (!COMPOUNDING.has(n)) throw new Error('Choose a supported compounding frequency.');
  const r = ratePercent / 100;
  const amount = r === 0 || t === 0 ? p : p * (1 + r / n) ** (n * t);
  ensureFinite(amount, 'Final amount');
  return { amount, interest: ensureFinite(amount - p, 'Interest earned'), compoundsPerYear: n };
}

export function loanPayment({ principal, annualRate, years }) {
  const p = positive(principal, 'Loan amount');
  const ratePercent = percent(annualRate, 'Annual interest rate');
  const t = positive(years, 'Loan tenure');
  const months = t * 12;
  if (!Number.isFinite(months) || months <= 0 || months > 1200) {
    throw new Error('Loan tenure must be greater than zero and no more than 100 years.');
  }
  const monthlyRate = ratePercent / 100 / 12;
  const monthlyPayment = monthlyRate === 0
    ? p / months
    : p * monthlyRate * (1 + monthlyRate) ** months / ((1 + monthlyRate) ** months - 1);
  ensureFinite(monthlyPayment, 'Monthly payment');
  const totalPayment = ensureFinite(monthlyPayment * months, 'Total payment');
  return {
    monthlyPayment,
    totalPayment,
    totalInterest: ensureFinite(totalPayment - p, 'Total interest'),
    months,
  };
}

export function savingsGoal({ currentSavings, goal, monthlySaving }) {
  const current = nonNegative(currentSavings, 'Current savings');
  const target = nonNegative(goal, 'Savings goal');
  const monthly = nonNegative(monthlySaving, 'Monthly saving');
  if (current >= target) return { months: 0, exactMonths: 0, remaining: 0, finalContribution: 0, reached: true };
  const remaining = target - current;
  if (monthly === 0) {
    return { months: null, exactMonths: null, remaining, finalContribution: null, reached: false, unreachable: true };
  }
  const exactMonths = remaining / monthly;
  const months = Math.ceil(exactMonths);
  const finalContribution = remaining - monthly * Math.max(0, months - 1);
  return { months, exactMonths, remaining, finalContribution, reached: false, unreachable: false };
}

export function investmentGrowth({ principal, annualRate, years, compoundsPerYear = 1 }) {
  return compoundInterest({ principal, annualRate, years, compoundsPerYear });
}

export function profitMargin({ cost, sellingPrice }) {
  const c = nonNegative(cost, 'Cost price');
  const selling = positive(sellingPrice, 'Selling price');
  const profit = ensureFinite(selling - c, 'Profit');
  const margin = ensureFinite((profit / selling) * 100, 'Profit margin');
  const markup = c === 0 ? null : ensureFinite((profit / c) * 100, 'Markup');
  return { profit, margin, markup };
}

export function percentageChange({ oldValue, newValue }) {
  const oldNumber = readNumber(oldValue, 'Old value');
  const newNumber = readNumber(newValue, 'New value');
  if (oldNumber < 0 || newNumber < 0) {
    throw new Error('Old and new values must be zero or greater for this calculator.');
  }
  if (oldNumber === 0) {
    throw new Error('Percentage change from a zero baseline is undefined. Enter an old value greater than zero.');
  }
  return { change: ensureFinite(((newNumber - oldNumber) / oldNumber) * 100, 'Percentage change') };
}

export function budgetPlan({ income, rent, food, transport, utilities, other }) {
  const monthlyIncome = nonNegative(income, 'Monthly income');
  const expenseEntries = {
    rent: nonNegative(rent, 'Rent / housing'),
    food: nonNegative(food, 'Food'),
    transport: nonNegative(transport, 'Transport'),
    utilities: nonNegative(utilities, 'Utilities'),
    other: nonNegative(other, 'Other expenses'),
  };
  const totalExpenses = ensureFinite(Object.values(expenseEntries).reduce((sum, value) => sum + value, 0), 'Total expenses');
  const remaining = ensureFinite(monthlyIncome - totalExpenses, 'Remaining amount');
  const percentages = Object.fromEntries(Object.entries(expenseEntries).map(([key, value]) => [key, monthlyIncome > 0 ? value / monthlyIncome * 100 : null]));
  return { income: monthlyIncome, expenses: expenseEntries, totalExpenses, remaining, deficit: remaining < 0 ? Math.abs(remaining) : 0, percentages };
}

export function salaryBreakdown({ annualSalary }) {
  const annual = nonNegative(annualSalary, 'Annual salary');
  return {
    annual,
    monthly: ensureFinite(annual / 12, 'Monthly equivalent'),
    weekly: ensureFinite(annual / 52, 'Weekly equivalent'),
    workingDay: ensureFinite(annual / 260, 'Working-day equivalent'),
  };
}

export function loanAffordability({ annualIncome, incomeMultiple = 5 }) {
  const income = nonNegative(annualIncome, 'Annual income');
  const multiplier = positive(incomeMultiple, 'Income multiple');
  if (multiplier > 20) throw new Error('Income multiple must be 20 or lower for this estimate.');
  return { borrowingCeiling: ensureFinite(income * multiplier, 'Estimated borrowing ceiling'), multiplier };
}

export function breakEven({ fixedCosts, sellingPrice, variableCost }) {
  const fixed = nonNegative(fixedCosts, 'Fixed costs');
  const selling = positive(sellingPrice, 'Selling price per unit');
  const variable = nonNegative(variableCost, 'Variable cost per unit');
  const contribution = selling - variable;
  if (contribution <= 0) {
    throw new Error('Selling price must be greater than variable cost per unit; otherwise break-even cannot be reached.');
  }
  const exactUnits = ensureFinite(fixed / contribution, 'Break-even quantity');
  return { contribution, exactUnits, wholeUnits: Math.ceil(exactUnits), breakEvenRevenue: ensureFinite(Math.ceil(exactUnits) * selling, 'Break-even revenue') };
}

export function cagr({ beginningValue, endingValue, years }) {
  const beginning = positive(beginningValue, 'Beginning value');
  const ending = positive(endingValue, 'Ending value');
  const t = positive(years, 'Years');
  const rate = ensureFinite(((ending / beginning) ** (1 / t) - 1) * 100, 'CAGR');
  return { rate };
}

export function roi({ cost, returnValue }) {
  const investmentCost = positive(cost, 'Investment cost');
  const finalReturn = nonNegative(returnValue, 'Return / final value');
  const profit = ensureFinite(finalReturn - investmentCost, 'Profit / loss');
  return { profit, rate: ensureFinite((profit / investmentCost) * 100, 'ROI') };
}

export function commission({ sales, commissionRate }) {
  const amount = nonNegative(sales, 'Sales amount');
  const rate = percent(commissionRate, 'Commission rate', { max: 100 });
  return { commission: ensureFinite(amount * rate / 100, 'Commission') };
}

export const FINANCE_TOOL_IDS = [
  'simple-interest-calculator',
  'compound-interest-calculator',
  'emi-calculator',
  'loan-payment-calculator',
  'savings-goal-calculator',
  'investment-growth-calculator',
  'profit-margin-calculator',
  'percentage-change-calculator',
  'budget-planner',
  'salary-breakdown-calculator',
  'loan-affordability-calculator',
  'break-even-calculator',
  'cagr-calculator',
  'roi-calculator',
  'commission-calculator',
];

export function calculateFinanceTool(id, values) {
  switch (id) {
    case 'simple-interest-calculator': return simpleInterest(values);
    case 'compound-interest-calculator': return compoundInterest(values);
    case 'emi-calculator': return loanPayment(values);
    case 'loan-payment-calculator': return loanPayment(values);
    case 'savings-goal-calculator': return savingsGoal(values);
    case 'investment-growth-calculator': return investmentGrowth(values);
    case 'profit-margin-calculator': return profitMargin(values);
    case 'percentage-change-calculator': return percentageChange(values);
    case 'budget-planner': return budgetPlan(values);
    case 'salary-breakdown-calculator': return salaryBreakdown(values);
    case 'loan-affordability-calculator': return loanAffordability(values);
    case 'break-even-calculator': return breakEven(values);
    case 'cagr-calculator': return cagr(values);
    case 'roi-calculator': return roi(values);
    case 'commission-calculator': return commission(values);
    default: throw new Error(`Unknown finance tool: ${id}`);
  }
}
