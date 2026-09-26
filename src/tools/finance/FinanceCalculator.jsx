import { useMemo, useState } from 'react';
import { Calculator, Copy, RotateCcw } from 'lucide-react';
import {
  COMPOUNDING_OPTIONS,
  calculateFinanceTool,
} from '../../lib/finance/calculators.js';
import { announceToolSuccess } from '../../lib/toolSuccess.js';
import { trackEvent } from '../../lib/analytics.js';
import { notify } from '../../lib/toast.js';

const CURRENCIES = [
  ['PKR', 'PKR — Pakistani Rupee'],
  ['USD', 'USD — US Dollar'],
  ['EUR', 'EUR — Euro'],
  ['GBP', 'GBP — British Pound'],
];


const definitions = {
  'simple-interest-calculator': {
    formula: 'Simple Interest = Principal × Annual Rate × Time ÷ 100',
    intro: 'Calculate simple interest without compounding and the final principal-plus-interest amount.',
    fields: [
      ['principal', 'Principal', '10000'], ['annualRate', 'Annual interest rate (%)', '5'], ['years', 'Time (years)', '2'],
    ],
    metrics: (r) => [['Interest', r.interest, 'currency'], ['Total amount', r.total, 'currency']],
  },
  'compound-interest-calculator': {
    formula: 'A = P(1 + r/n)^(nt)',
    intro: 'Estimate compound growth from a principal, annual rate, time and compounding frequency.',
    fields: [
      ['principal', 'Principal', '10000'], ['annualRate', 'Annual interest rate (%)', '5'], ['years', 'Time (years)', '2'],
      ['compoundsPerYear', 'Compounding', '1', 'select', COMPOUNDING_OPTIONS],
    ],
    metrics: (r) => [['Final amount', r.amount, 'currency'], ['Interest earned', r.interest, 'currency']],
  },
  'emi-calculator': {
    formula: 'EMI = P × r × (1+r)^n ÷ ((1+r)^n − 1)',
    intro: 'Estimate the fixed monthly installment for a standard amortizing loan.',
    fields: [['principal', 'Loan amount', '1000000'], ['annualRate', 'Annual interest rate (%)', '12'], ['years', 'Loan tenure (years)', '5']],
    metrics: (r) => [['Monthly EMI', r.monthlyPayment, 'currency'], ['Total payment', r.totalPayment, 'currency'], ['Total interest', r.totalInterest, 'currency'], ['Payments', r.months, 'number']],
    note: 'This is a mathematical loan estimate. Fees, insurance, taxes and lender-specific terms are not included.',
  },
  'loan-payment-calculator': {
    formula: 'Monthly payment uses the standard fixed-rate amortizing-loan formula.',
    intro: 'Estimate monthly payment, total repayment and total interest for a fixed-rate loan.',
    fields: [['principal', 'Loan amount', '250000'], ['annualRate', 'Annual interest rate (%)', '8'], ['years', 'Loan term (years)', '5']],
    metrics: (r) => [['Monthly payment', r.monthlyPayment, 'currency'], ['Total payment', r.totalPayment, 'currency'], ['Total interest', r.totalInterest, 'currency']],
    note: 'Mathematically, this is the same fixed-payment model commonly called EMI. The separate page uses more general loan wording.',
  },
  'savings-goal-calculator': {
    formula: 'Months needed = ceil((Goal − Current Savings) ÷ Monthly Saving)',
    intro: 'Estimate how many whole months are needed to reach a savings goal without investment growth.',
    fields: [['currentSavings', 'Current savings', '0'], ['goal', 'Savings goal', '10000'], ['monthlySaving', 'Monthly saving', '1000']],
    metrics: (r) => r.unreachable
      ? [['Remaining amount', r.remaining, 'currency'], ['Status', 'Goal cannot be reached with zero monthly saving.', 'text']]
      : [['Months needed', r.months, 'number'], ['Remaining before future saving', r.remaining, 'currency'], ['Final month contribution', r.finalContribution, 'currency']],
    note: 'No interest or investment return is applied. Results assume the entered amount is saved consistently each month.',
  },
  'investment-growth-calculator': {
    formula: 'A = P(1 + r/n)^(nt)',
    intro: 'Estimate growth of a single initial investment using compound returns. Periodic contributions are not included.',
    fields: [
      ['principal', 'Initial investment', '10000'], ['annualRate', 'Annual return (%)', '10'], ['years', 'Time (years)', '10'],
      ['compoundsPerYear', 'Compounding', '1', 'select', COMPOUNDING_OPTIONS],
    ],
    metrics: (r) => [['Estimated final value', r.amount, 'currency'], ['Estimated growth', r.interest, 'currency']],
    note: 'This is a compound-growth illustration, not a forecast or investment recommendation. It assumes a constant annual return.',
  },
  'profit-margin-calculator': {
    formula: 'Profit = Selling Price − Cost; Margin = Profit ÷ Selling Price; Markup = Profit ÷ Cost',
    intro: 'Compare profit margin and markup correctly from cost price and selling price.',
    fields: [['cost', 'Cost price', '80'], ['sellingPrice', 'Selling price', '100']],
    metrics: (r) => [['Profit / loss', r.profit, 'currency'], ['Profit margin', r.margin, 'percent'], ['Markup', r.markup, r.markup === null ? 'na' : 'percent']],
    note: 'Margin and markup use different denominators. If cost is zero, markup is not mathematically defined.',
  },
  'percentage-change-calculator': {
    showCurrency: false,
    formula: 'Percentage Change = (New − Old) ÷ Old × 100',
    intro: 'Calculate percentage increase or decrease from a positive baseline value.',
    fields: [['oldValue', 'Old value', '100'], ['newValue', 'New value', '120']],
    metrics: (r) => [['Percentage change', r.change, 'signedPercent']],
  },
  'budget-planner': {
    formula: 'Remaining = Monthly Income − Total Monthly Expenses',
    intro: 'Enter your actual monthly income and expense categories to calculate spending, remaining income or deficit.',
    fields: [
      ['income', 'Monthly income', '100000'], ['rent', 'Rent / housing', '30000'], ['food', 'Food', '15000'],
      ['transport', 'Transport', '10000'], ['utilities', 'Utilities', '8000'], ['other', 'Other expenses', '7000'],
    ],
    metrics: (r) => [
      ['Total expenses', r.totalExpenses, 'currency'],
      [r.remaining >= 0 ? 'Remaining' : 'Deficit', Math.abs(r.remaining), 'currency'],
      ['Rent share of income', r.percentages.rent, r.percentages.rent === null ? 'na' : 'percent'],
    ],
    note: 'This planner only totals the values you enter; it does not apply a fixed budgeting rule or pretend to know your ideal allocation.',
  },
  'salary-breakdown-calculator': {
    formula: 'Monthly = Annual ÷ 12; Weekly = Annual ÷ 52; Working day = Annual ÷ 260',
    intro: 'Convert an annual salary into transparent monthly, weekly and working-day equivalents.',
    fields: [['annualSalary', 'Annual salary', '1200000']],
    metrics: (r) => [['Annual', r.annual, 'currency'], ['Monthly', r.monthly, 'currency'], ['Weekly (annual ÷ 52)', r.weekly, 'currency'], ['Working day (annual ÷ 260)', r.workingDay, 'currency']],
    note: 'The working-day estimate assumes 260 working days per year (52 weeks × 5 days). Taxes and deductions are not included.',
  },
  'loan-affordability-calculator': {
    formula: 'Illustrative borrowing ceiling = Annual Income × Income Multiple',
    intro: 'Estimate a simple income-multiple borrowing ceiling. This is not lender approval or a debt-to-income assessment.',
    fields: [['annualIncome', 'Annual income', '1200000'], ['incomeMultiple', 'Income multiple', '5']],
    metrics: (r) => [['Estimated borrowing ceiling', r.borrowingCeiling, 'currency'], ['Income multiple used', r.multiplier, 'number']],
    note: 'Real lenders consider debt, expenses, credit history, rates, deposits, regulation and many other factors. This is only a simple ceiling estimate.',
  },
  'break-even-calculator': {
    formula: 'Break-even units = Fixed Costs ÷ (Selling Price − Variable Cost)',
    intro: 'Calculate contribution per unit and the sales quantity needed to cover fixed costs.',
    fields: [['fixedCosts', 'Fixed costs', '100000'], ['sellingPrice', 'Selling price per unit', '500'], ['variableCost', 'Variable cost per unit', '300']],
    metrics: (r) => [['Contribution per unit', r.contribution, 'currency'], ['Exact break-even quantity', r.exactUnits, 'number'], ['Minimum whole units', r.wholeUnits, 'number'], ['Revenue at whole-unit break-even', r.breakEvenRevenue, 'currency']],
  },
  'cagr-calculator': {
    showCurrency: false,
    formula: 'CAGR = (Ending Value ÷ Beginning Value)^(1 ÷ Years) − 1',
    intro: 'Calculate the constant annualized growth rate between two positive values over a chosen period.',
    fields: [['beginningValue', 'Beginning value', '10000'], ['endingValue', 'Ending value', '20000'], ['years', 'Years', '5']],
    metrics: (r) => [['CAGR', r.rate, 'percent']],
    note: 'CAGR smooths the full period into one annual rate and does not show year-to-year volatility.',
  },
  'roi-calculator': {
    formula: 'ROI = (Return − Cost) ÷ Cost × 100',
    intro: 'Calculate profit or loss and return on investment relative to the investment cost.',
    fields: [['cost', 'Investment cost', '10000'], ['returnValue', 'Return / final value', '12000']],
    metrics: (r) => [['Profit / loss', r.profit, 'currency'], ['ROI', r.rate, 'signedPercent']],
  },
  'commission-calculator': {
    formula: 'Commission = Sales × Commission Rate ÷ 100',
    intro: 'Calculate commission from a sales amount and percentage rate.',
    fields: [['sales', 'Sales amount', '100000'], ['commissionRate', 'Commission rate (%)', '5']],
    metrics: (r) => [['Commission', r.commission, 'currency']],
  },
};

function formatNumber(value, maximumFractionDigits = 2) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits }).format(value);
}

function formatMetric(value, type, currency) {
  if (type === 'text') return String(value);
  if (type === 'na' || value === null || value === undefined) return 'Not defined';
  if (type === 'currency') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
  }
  if (type === 'percent') return `${formatNumber(value, 4)}%`;
  if (type === 'signedPercent') return `${value > 0 ? '+' : ''}${formatNumber(value, 4)}%`;
  return formatNumber(value, 4);
}

function initialValues(fields) {
  return Object.fromEntries(fields.map(([key,,defaultValue]) => [key, defaultValue]));
}

function Field({ field, value, onChange }) {
  const [key, label,, type = 'number', options] = field;
  if (type === 'select') {
    return <label className="text-sm font-semibold text-navy-800 dark:text-navy-100">
      <span>{label}</span>
      <select className="mz-input mt-2 min-h-12" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>;
  }
  return <label className="text-sm font-semibold text-navy-800 dark:text-navy-100">
    <span>{label}</span>
    <input
      className="mz-input mt-2 min-h-12"
      type="number"
      step="any"
      inputMode="decimal"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      data-finance-field={key}
    />
  </label>;
}

export default function FinanceCalculator({ id, tool }) {
  const definition = definitions[id];
  if (!definition) throw new Error(`Finance implementation missing for ${id}`);

  const [values, setValues] = useState(() => initialValues(definition.fields));
  const [currency, setCurrency] = useState('PKR');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const metrics = useMemo(() => result ? definition.metrics(result) : [], [definition, result]);
  const update = (key, value) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    setError('');
  };

  const calculate = () => {
    setError('');
    try {
      const next = calculateFinanceTool(id, values);
      setResult(next);
      trackEvent('calculator_complete', { tool_id: id, tool_name: tool?.name || id, category: 'finance-tools' });
      announceToolSuccess({ source: 'calculation' });
    } catch (err) {
      const message = err?.message || 'Could not calculate this result.';
      setResult(null);
      setError(message);
      trackEvent('calculator_validation_error', { tool_id: id, error_message: message.slice(0, 100) });
    }
  };

  const reset = () => {
    setValues(initialValues(definition.fields));
    setResult(null);
    setError('');
    trackEvent('calculator_reset', { tool_id: id });
  };

  const copyResult = async () => {
    if (!metrics.length) return;
    const text = metrics.map(([label, value, type]) => `${label}: ${formatMetric(value, type, currency)}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      notify('Result copied to clipboard.', { type: 'success', title: 'Calculation' });
    } catch {
      notify('Clipboard access is unavailable in this browser.', { type: 'error', title: 'Copy result' });
    }
  };

  return <div className="space-y-6" data-finance-tool={id}>
    <section className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4 dark:border-brand-900 dark:bg-brand-950/20">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm dark:bg-navy-900 dark:text-brand-300"><Calculator className="h-5 w-5" aria-hidden="true"/></span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">Formula and assumptions</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-navy-900 dark:text-white">{definition.formula}</p>
          <p className="mt-2 text-sm leading-6 text-navy-600 dark:text-navy-300">{definition.intro}</p>
        </div>
      </div>
    </section>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {definition.fields.map((field) => <Field key={field[0]} field={field} value={values[field[0]]} onChange={(value) => update(field[0], value)} />)}
      {definition.showCurrency !== false ? <label className="text-sm font-semibold text-navy-800 dark:text-navy-100">
        <span>Display currency</span>
        <select className="mz-input mt-2 min-h-12" value={currency} onChange={(event) => setCurrency(event.target.value)}>
          {CURRENCIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <span className="mt-1 block text-xs font-normal leading-5 text-navy-500 dark:text-navy-400">Formatting only — no exchange-rate conversion is performed.</span>
      </label> : null}
    </div>

    <div className="flex flex-wrap gap-2">
      <button type="button" className="mz-btn-primary min-h-11" onClick={calculate}><Calculator className="h-4 w-4" aria-hidden="true"/>Calculate</button>
      <button type="button" className="mz-btn-secondary min-h-11" onClick={reset}><RotateCcw className="h-4 w-4" aria-hidden="true"/>Reset</button>
      {metrics.length ? <button type="button" className="mz-btn-ghost min-h-11" onClick={copyResult}><Copy className="h-4 w-4" aria-hidden="true"/>Copy result</button> : null}
    </div>

    {error ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium leading-6 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">{error}</div> : null}

    <section className="rounded-3xl border border-navy-100 bg-white p-5 shadow-sm dark:border-navy-800 dark:bg-navy-900" aria-live="polite" aria-atomic="true">
      <p className="text-xs font-bold uppercase tracking-wider text-navy-400">Result</p>
      {!metrics.length ? <p className="mt-2 text-base font-semibold text-navy-600 dark:text-navy-300">Enter the values above and select Calculate.</p> : <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {metrics.map(([label, value, type]) => <div key={label} className="min-w-0 rounded-2xl bg-navy-50 p-4 dark:bg-navy-950/60">
          <dt className="text-xs font-bold uppercase tracking-wide text-navy-500 dark:text-navy-400">{label}</dt>
          <dd className="mt-1 break-words text-xl font-black tracking-tight text-navy-950 dark:text-white">{formatMetric(value, type, currency)}</dd>
        </div>)}
      </dl>}
    </section>

    {definition.note ? <p className="text-xs leading-5 text-navy-500 dark:text-navy-400">{definition.note}</p> : null}
    <p className="text-xs leading-5 text-navy-500 dark:text-navy-400">Financial calculations are informational mathematical estimates.{definition.showCurrency !== false ? ' Currency selection changes display formatting only and does not convert values between currencies.' : ''}</p>
  </div>;
}
