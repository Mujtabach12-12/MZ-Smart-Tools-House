import assert from 'node:assert/strict';
import {
  FINANCE_TOOL_IDS,
  simpleInterest,
  compoundInterest,
  loanPayment,
  savingsGoal,
  investmentGrowth,
  profitMargin,
  percentageChange,
  budgetPlan,
  salaryBreakdown,
  loanAffordability,
  breakEven,
  cagr,
  roi,
  commission,
  calculateFinanceTool,
} from '../src/lib/finance/calculators.js';

function close(actual, expected, tolerance = 1e-9, label = '') {
  assert.ok(Number.isFinite(actual), `${label || 'value'} must be finite`);
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label || actual}: expected ${expected}, received ${actual}`);
}

assert.equal(FINANCE_TOOL_IDS.length, 15, 'Business & Finance must contain 15 calculation engines');

// 01 Simple interest
let r = simpleInterest({ principal: 10000, annualRate: 5, years: 2 });
close(r.interest, 1000); close(r.total, 11000);
r = simpleInterest({ principal: 5000, annualRate: 7.5, years: 3 });
close(r.interest, 1125); close(r.total, 6125);
r = simpleInterest({ principal: 10000, annualRate: 0, years: 5 });
close(r.interest, 0); close(r.total, 10000);
assert.throws(() => simpleInterest({ principal: -1, annualRate: 5, years: 1 }), /cannot be negative/);
assert.throws(() => simpleInterest({ principal: '', annualRate: 5, years: 1 }), /Please enter Principal/);

// 02 Compound interest — independently expected P*(1+r/n)^(nt)
r = compoundInterest({ principal: 10000, annualRate: 5, years: 2, compoundsPerYear: 1 });
close(r.amount, 11025, 1e-9); close(r.interest, 1025, 1e-9);
r = compoundInterest({ principal: 10000, annualRate: 6, years: 3, compoundsPerYear: 1 });
close(r.amount, 10000 * 1.06 ** 3, 1e-9);
r = compoundInterest({ principal: 10000, annualRate: 0, years: 3, compoundsPerYear: 12 });
close(r.amount, 10000);
r = compoundInterest({ principal: 10000, annualRate: 12, years: 1, compoundsPerYear: 12 });
close(r.amount, 10000 * 1.01 ** 12, 1e-9);
assert.throws(() => compoundInterest({ principal: 1000, annualRate: 5, years: 1, compoundsPerYear: 3 }), /supported compounding/);

// 03 EMI
r = loanPayment({ principal: 1000000, annualRate: 12, years: 5 });
close(r.monthlyPayment, 22244.447684901763, 0.005, 'EMI 1');
close(r.totalPayment, r.monthlyPayment * 60, 1e-6);
close(r.totalInterest, r.totalPayment - 1000000, 1e-6);
r = loanPayment({ principal: 500000, annualRate: 10, years: 3 });
close(r.monthlyPayment, 16133.59359691879, 0.005, 'EMI 2');
r = loanPayment({ principal: 500000, annualRate: 0, years: 3 });
close(r.monthlyPayment, 500000 / 36, 1e-9);
assert.throws(() => loanPayment({ principal: 0, annualRate: 10, years: 3 }), /greater than zero/);
assert.throws(() => loanPayment({ principal: 1000, annualRate: 10, years: 0 }), /greater than zero/);

// 04 Generic loan payment
r = loanPayment({ principal: 250000, annualRate: 8, years: 5 });
close(r.monthlyPayment, 5069.098572103462, 0.005);

// 05 Savings goal — no investment growth
r = savingsGoal({ currentSavings: 0, goal: 10000, monthlySaving: 1000 });
assert.equal(r.months, 10); close(r.remaining, 10000);
r = savingsGoal({ currentSavings: 2500, goal: 10000, monthlySaving: 1500 });
assert.equal(r.months, 5); close(r.finalContribution, 1500);
r = savingsGoal({ currentSavings: 12000, goal: 10000, monthlySaving: 0 });
assert.equal(r.months, 0); assert.equal(r.reached, true);
r = savingsGoal({ currentSavings: 2500, goal: 10000, monthlySaving: 0 });
assert.equal(r.unreachable, true); assert.equal(r.months, null);

// 06 Investment growth — single principal only
r = investmentGrowth({ principal: 10000, annualRate: 10, years: 10, compoundsPerYear: 1 });
close(r.amount, 25937.424601000024, 1e-6);
r = investmentGrowth({ principal: 10000, annualRate: 0, years: 10, compoundsPerYear: 12 });
close(r.amount, 10000);

// 07 Profit margin / markup
r = profitMargin({ cost: 80, sellingPrice: 100 });
close(r.profit, 20); close(r.margin, 20); close(r.markup, 25);
r = profitMargin({ cost: 50, sellingPrice: 75 });
close(r.profit, 25); close(r.margin, 100 / 3, 1e-12); close(r.markup, 50);
r = profitMargin({ cost: 0, sellingPrice: 100 });
assert.equal(r.markup, null); close(r.margin, 100);

// 08 Percentage change
close(percentageChange({ oldValue: 100, newValue: 120 }).change, 20);
close(percentageChange({ oldValue: 100, newValue: 80 }).change, -20);
close(percentageChange({ oldValue: 50, newValue: 75 }).change, 50);
assert.throws(() => percentageChange({ oldValue: 0, newValue: 10 }), /zero baseline is undefined/);
assert.throws(() => percentageChange({ oldValue: -10, newValue: 10 }), /zero or greater/);

// 09 Budget planner
r = budgetPlan({ income: 100000, rent: 30000, food: 15000, transport: 10000, utilities: 8000, other: 7000 });
close(r.totalExpenses, 70000); close(r.remaining, 30000); close(r.percentages.rent, 30);
r = budgetPlan({ income: 50000, rent: 30000, food: 20000, transport: 5000, utilities: 5000, other: 0 });
close(r.totalExpenses, 60000); close(r.remaining, -10000); close(r.deficit, 10000);
r = budgetPlan({ income: 0, rent: 0, food: 0, transport: 0, utilities: 0, other: 0 });
close(r.totalExpenses, 0); close(r.remaining, 0); assert.equal(r.percentages.rent, null);

// 10 Salary breakdown
r = salaryBreakdown({ annualSalary: 1200000 });
close(r.monthly, 100000); close(r.weekly, 1200000 / 52); close(r.workingDay, 1200000 / 260);
r = salaryBreakdown({ annualSalary: 600000 }); close(r.monthly, 50000);

// 11 Loan affordability — explicit income multiple model
r = loanAffordability({ annualIncome: 1200000, incomeMultiple: 5 });
close(r.borrowingCeiling, 6000000); close(r.multiplier, 5);
assert.throws(() => loanAffordability({ annualIncome: 1200000, incomeMultiple: 0 }), /greater than zero/);

// 12 Break even
r = breakEven({ fixedCosts: 100000, sellingPrice: 500, variableCost: 300 });
close(r.contribution, 200); close(r.exactUnits, 500); assert.equal(r.wholeUnits, 500);
r = breakEven({ fixedCosts: 50000, sellingPrice: 100, variableCost: 75 });
close(r.exactUnits, 2000);
assert.throws(() => breakEven({ fixedCosts: 1000, sellingPrice: 50, variableCost: 50 }), /cannot be reached/);

// 13 CAGR
close(cagr({ beginningValue: 10000, endingValue: 20000, years: 5 }).rate, 14.869835499703509, 1e-10);
close(cagr({ beginningValue: 10000, endingValue: 10000, years: 5 }).rate, 0, 1e-12);
close(cagr({ beginningValue: 10000, endingValue: 5000, years: 5 }).rate, -12.9449436703876, 1e-10);
assert.throws(() => cagr({ beginningValue: 0, endingValue: 100, years: 2 }), /greater than zero/);

// 14 ROI
r = roi({ cost: 10000, returnValue: 12000 }); close(r.profit, 2000); close(r.rate, 20);
r = roi({ cost: 10000, returnValue: 8000 }); close(r.profit, -2000); close(r.rate, -20);
r = roi({ cost: 10000, returnValue: 10000 }); close(r.rate, 0);
assert.throws(() => roi({ cost: 0, returnValue: 10000 }), /greater than zero/);

// 15 Commission
close(commission({ sales: 100000, commissionRate: 5 }).commission, 5000);
close(commission({ sales: 250000, commissionRate: 2.5 }).commission, 6250);
close(commission({ sales: 0, commissionRate: 5 }).commission, 0);
assert.throws(() => commission({ sales: -1, commissionRate: 5 }), /cannot be negative/);
assert.throws(() => commission({ sales: 100, commissionRate: 101 }), /cannot be greater than 100/);

// Dispatch coverage and finite large-but-supported values
const dispatchSamples = {
  'simple-interest-calculator': { principal: 1e9, annualRate: 5.5, years: 1.25 },
  'compound-interest-calculator': { principal: 1e6, annualRate: 7.25, years: 2.5, compoundsPerYear: 4 },
  'emi-calculator': { principal: 1e6, annualRate: 12.75, years: 5 },
  'loan-payment-calculator': { principal: 250000, annualRate: 8, years: 5 },
  'savings-goal-calculator': { currentSavings: 100, goal: 5000, monthlySaving: 333.33 },
  'investment-growth-calculator': { principal: 10000, annualRate: 10, years: 10, compoundsPerYear: 1 },
  'profit-margin-calculator': { cost: 80, sellingPrice: 100 },
  'percentage-change-calculator': { oldValue: 100, newValue: 120 },
  'budget-planner': { income: 100000, rent: 30000, food: 15000, transport: 10000, utilities: 8000, other: 7000 },
  'salary-breakdown-calculator': { annualSalary: 1200000 },
  'loan-affordability-calculator': { annualIncome: 1200000, incomeMultiple: 5 },
  'break-even-calculator': { fixedCosts: 100000, sellingPrice: 500, variableCost: 300 },
  'cagr-calculator': { beginningValue: 10000, endingValue: 20000, years: 5 },
  'roi-calculator': { cost: 10000, returnValue: 12000 },
  'commission-calculator': { sales: 100000, commissionRate: 5 },
};
for (const id of FINANCE_TOOL_IDS) assert.ok(calculateFinanceTool(id, dispatchSamples[id]), `${id} should dispatch`);

console.log('Business & Finance regression tests passed: 15 tools, reference mathematics, decimals, zero/boundary cases, invalid inputs and dispatch coverage.');
