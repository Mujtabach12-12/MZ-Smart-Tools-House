/** Source-aligned, original editorial content for selected working calculators. Not an AdSense-approval assertion. */
export const reviewedToolSeo = {
  "scholarship-percentage-calculator": {
    "title": "Scholarship Marks Percentage Calculator – Calculate Academic %",
    "description": "Calculate academic percentage from obtained and total marks, then check the scholarship provider's published eligibility rules. No invented cutoff or CGPA conversion.",
    "intro": "Scholarship application forms may ask for an academic percentage, but calculating that percentage is different from checking eligibility. This page converts marks you actually earned into a percentage of maximum marks. Scholarships can also depend on verified grade conversion rules, study program, financial circumstances and deadlines.",
    "formula": "Academic percentage = (obtained marks ÷ maximum marks) × 100. Maximum marks must be greater than zero; obtained marks cannot be negative or exceed the maximum.",
    "example": "If you earned 420 marks out of 500, 420 ÷ 500 × 100 = 84%. That is your marks percentage, not a decision that you qualify for any specific scholarship.",
    "howTo": [
      "Enter the obtained marks from your official result or transcript.",
      "Enter the maximum marks on that same result, ensuring that both values refer to the same subjects and assessment.",
      "Read the calculated percentage, then compare it yourself against the scholarship provider's published conditions."
    ],
    "features": [
      "Calculates the actual obtained-to-maximum marks percentage",
      "Checks that marks and maximum are sensible",
      "Does not invent scholarship eligibility or university CGPA conversion"
    ],
    "useCases": [
      "Prepare a marks percentage for a scholarship form",
      "Cross-check a college transcript percentage",
      "Understand a percentage requirement before reading official eligibility criteria"
    ],
    "limitations": "Institutions have different scholarship rules and CGPA conversion schemes. The calculator has no verified eligibility database and does not predict selection, award size or merit status. Use official policies for every scholarship decision.",
    "faq": [
      [
        "Does 84% guarantee a scholarship?",
        "No. It is a marks percentage only. Actual eligibility depends on each scholarship's published requirements."
      ],
      [
        "Can I enter my CGPA instead of marks?",
        "No. Enter obtained and maximum marks. CGPA-to-percentage conversion must follow a verified institutional policy."
      ]
    ]
  },
  "loan-payment-calculator": {
    "title": "Loan Payment Calculator – Monthly Installment & Interest",
    "description": "Estimate a fixed-rate monthly loan installment, total repayment and interest from principal, annual rate and years. Understand the amortization assumptions.",
    "intro": "A fixed-rate amortizing loan has scheduled payments that cover interest and reduce the outstanding principal. The calculator produces a mathematical estimate based on the principal, annual interest percentage and number of years you enter. It is not a lender's quotation.",
    "formula": "Monthly rate r = annual rate ÷ 100 ÷ 12 and payment count n = 12 × years. Payment = P × r × (1+r)^n ÷ ((1+r)^n − 1); for zero rate, payment = P ÷ n.",
    "example": "A 120,000 loan at 12% annual interest over 12 months uses a 1% monthly rate. Its estimated monthly payment is approximately 10,661.85 before fees, taxes or insurance.",
    "howTo": [
      "Enter only the principal amount actually borrowed.",
      "Enter the annual interest percentage and the number of years of scheduled repayment.",
      "Compare monthly installment with total repayment and total interest; separately read the lender's fee, APR and early-repayment terms."
    ],
    "features": [
      "Fixed-rate amortization estimate",
      "Distinct monthly, total and interest values",
      "Explicit zero-interest calculation"
    ],
    "useCases": [
      "Check whether an installment fits a monthly budget",
      "Compare a short versus long loan term",
      "Understand how interest affects the total repaid"
    ],
    "limitations": "Actual loan offers may include fees, insurance, variable rates, taxes, payment schedules or early repayment rules. This mathematical model does not evaluate eligibility or offer financial advice.",
    "faq": [
      [
        "Is this the same mathematics as EMI?",
        "For fixed-rate installment loans, yes. EMI and monthly loan payment normally use the same amortization formula."
      ],
      [
        "Why is total repayment more than the amount borrowed?",
        "The difference represents interest under the model; actual fees may raise the cost further."
      ]
    ]
  },
  "savings-goal-calculator": {
    "title": "Savings Goal Calculator – Months to Reach Your Target",
    "description": "Calculate the whole months needed to reach a savings target from current savings and monthly contributions, without inventing interest or investment growth.",
    "intro": "This tool gives a simple savings timeline based on real amounts you enter. It assumes you can contribute the same amount every month and does not add imaginary investment returns. Seeing the remaining gap separately can make a target easier to plan.",
    "formula": "Remaining = max(0, target − current savings). If monthly saving is positive, months needed = ceil(remaining ÷ monthly saving).",
    "example": "If your target is 10,000 and you have 2,500, you need 7,500 more. Saving 1,500 every month closes that gap in 5 whole months.",
    "howTo": [
      "Enter the balance you already saved.",
      "Enter the total target amount and a monthly contribution you can realistically maintain.",
      "Read months needed; if monthly saving is zero while a gap remains, the goal cannot be reached under these assumptions."
    ],
    "features": [
      "Whole-month savings calculation",
      "Separates target, current savings and remaining gap",
      "Correct no-progress handling for zero monthly savings"
    ],
    "useCases": [
      "Plan education or equipment expenses",
      "Estimate a short-term emergency fund timeline",
      "Explore how a bigger monthly contribution changes timing"
    ],
    "limitations": "The result excludes inflation, interest, variable income, account fees and withdrawals. Changing your contribution or target changes the timeline; update the inputs whenever your situation changes.",
    "faq": [
      [
        "What if I already have more than the goal?",
        "The remaining amount is zero, so no additional savings months are needed."
      ],
      [
        "Does this estimate include investment returns?",
        "No. It assumes saving only, without compounding or returns."
      ]
    ]
  },
  "potential-energy-calculator": {
    "title": "Gravitational Potential Energy Calculator – Mass × Height",
    "description": "Calculate near-Earth gravitational potential energy from mass in kilograms, height in metres and standard gravity 9.80665 m/s².",
    "intro": "Gravitational potential energy describes the energy change associated with an object's height relative to a chosen reference. This calculator uses SI units and standard gravitational acceleration near Earth. Its output is relative to your selected zero-height reference.",
    "formula": "PE = m × g × h, where mass m is in kilograms, height h in metres, and g = 9.80665 m/s². The result is joules (J).",
    "example": "A 2 kg object at a height of 3 m has PE = 2 × 9.80665 × 3 = 58.8399 J, or approximately 58.84 J.",
    "howTo": [
      "Enter the object's mass in kilograms.",
      "Enter its height in metres compared with your selected reference point.",
      "Calculate the energy in joules and interpret a negative height as below the chosen reference."
    ],
    "features": [
      "Mass and relative-height inputs",
      "Fixed, clearly identified reference gravity",
      "Output in joules with explicit SI units"
    ],
    "useCases": [
      "Check introductory mechanics problems",
      "Compare two lifting heights",
      "Estimate gravitational energy for a classroom experiment"
    ],
    "limitations": "The chosen zero reference matters. Local gravitational acceleration varies slightly, and this near-Earth constant is not suitable for arbitrary planets or extreme altitude conditions.",
    "faq": [
      [
        "Why can potential energy be negative?",
        "Height is measured relative to a chosen reference, so a position below zero height gives negative relative energy."
      ],
      [
        "Is g always exactly 9.80665?",
        "No. It is a standard reference value, not the precise acceleration at every location."
      ]
    ]
  },
  "parallel-resistance-calculator": {
    "title": "Parallel Resistance Calculator – Two Resistors (Ω)",
    "description": "Find the equivalent resistance of two positive resistors in parallel with R = R1×R2/(R1+R2), with a worked 100Ω and 200Ω example.",
    "intro": "Two resistors connected in parallel give current more than one branch to follow. Their equivalent resistance is lower than either individual positive resistor. The calculator accepts precisely two positive resistance values in ohms, not a multi-branch circuit.",
    "formula": "For two positive resistors, 1/R = 1/R1 + 1/R2, or equivalently R = (R1 × R2) ÷ (R1 + R2).",
    "example": "For a 100 Ω and 200 Ω pair, equivalent R = 100 × 200 ÷ 300 = approximately 66.67 Ω.",
    "howTo": [
      "Enter the first resistor's resistance in ohms.",
      "Enter the second resistor's resistance in ohms; both inputs must be greater than zero.",
      "Check that the equivalent resistance is smaller than the smaller entered resistor for a valid two-resistor parallel circuit."
    ],
    "features": [
      "Two-resistor reciprocal relationship",
      "Positive-resistance validation",
      "Result in ohms"
    ],
    "useCases": [
      "Verify school circuit calculations",
      "Plan two-resistor electronics experiments",
      "Compare equivalent resistance with a series combination"
    ],
    "limitations": "This tool only models two ideal positive-valued resistors. It does not model tolerances, temperature effects or a larger network. A short circuit with zero resistance is outside the accepted input range.",
    "faq": [
      [
        "Why is the answer less than 100 Ω?",
        "Parallel branches reduce equivalent resistance; 100 Ω in parallel with 200 Ω gives about 66.67 Ω."
      ],
      [
        "Can I add resistor values instead?",
        "Adding resistance values is the series-resistor calculation, not the parallel calculation."
      ]
    ]
  },
  "electrical-power-calculator": {
    "title": "Electrical Power Calculator – Voltage × Current (Watts)",
    "description": "Calculate electrical power in watts from voltage in volts and current in amperes, with a simple P = V×I example and practical limitations.",
    "intro": "Electrical power tells you the rate of electrical energy transfer. The calculator multiplies entered voltage in volts by current in amperes and returns watts. This simple direct product is especially useful for basic DC examples and resistive cases.",
    "formula": "P = V × I, with voltage in volts (V), current in amperes (A), and electrical power in watts (W).",
    "example": "A device operating at 12 V and drawing 2 A has an estimated power of 12 × 2 = 24 W under this simple model.",
    "howTo": [
      "Enter the voltage in volts, including the relevant sign if using signed values.",
      "Enter the current in amperes, not milliamperes; convert 500 mA to 0.5 A first.",
      "Calculate the product in watts and check whether the simple DC/resistive model matches your circuit."
    ],
    "features": [
      "Voltage and current input",
      "Transparent multiplication formula",
      "Watt output in SI units"
    ],
    "useCases": [
      "Check basic electronics homework",
      "Estimate DC device power",
      "Compare simple load examples"
    ],
    "limitations": "For AC circuits with phase difference, real average power can require power factor rather than simply multiplying RMS voltage and current. Do not treat this result as an electrical safety certification.",
    "faq": [
      [
        "How many watts is 12 V at 2 A?",
        "The simple product is 24 W."
      ],
      [
        "Can I use milliamperes directly?",
        "No. Convert milliamperes to amperes by dividing by 1,000 first."
      ]
    ]
  },
  "specific-heat-calculator": {
    "title": "Heat Energy Calculator – Mass × Specific Heat × ΔT",
    "description": "Calculate heat energy in joules from mass, specific heat capacity and temperature change using Q = m×c×ΔT with unit-aware examples.",
    "intro": "Heating or cooling a material changes its thermal energy. Under a constant-specific-heat approximation, the amount transferred is proportional to the mass, specific heat capacity and change in temperature. This tool solves for Q rather than solving for specific heat itself.",
    "formula": "Q = m × c × ΔT; use mass in kg, c in J/(kg·K) and temperature change in K. Positive Q indicates heating under the chosen convention.",
    "example": "Heating 2 kg of a material with c = 500 J/(kg·K) by 10 K requires Q = 2 × 500 × 10 = 10,000 J.",
    "howTo": [
      "Enter the mass in kilograms and the material's specific heat capacity in J/(kg·K).",
      "Enter the temperature change as final temperature minus initial temperature, in kelvins or equivalent Celsius-degree difference.",
      "Read the heat energy in joules and interpret a negative result as cooling under this convention."
    ],
    "features": [
      "Calculates energy Q from three inputs",
      "Explicit kilogram and specific-heat units",
      "Handles signed temperature changes"
    ],
    "useCases": [
      "Practice calorimetry problems",
      "Compare heating requirements for materials",
      "Estimate simple thermal energy changes"
    ],
    "limitations": "The calculation assumes an approximately constant specific heat over the temperature interval and ignores phase changes, heat losses and complicated material behavior. It does not infer the material's specific heat from a name.",
    "faq": [
      [
        "Can I use Celsius for a temperature difference?",
        "A difference of 10°C is numerically 10 K, though absolute temperatures use different zero points."
      ],
      [
        "Does the result include melting or evaporation?",
        "No. Phase changes can require latent heat that this formula does not model."
      ]
    ]
  },
  "normality-calculator": {
    "title": "Normality Calculator – Equivalents per Liter",
    "description": "Calculate normality in eq/L from entered equivalents and solution volume in liters, with a worked 0.5-equivalent example.",
    "intro": "Normality expresses equivalents of a substance per litre of solution. The number of equivalents depends on the chemical reaction, so this calculator requires equivalents directly; it does not guess them from a chemical formula or acid name.",
    "formula": "Normality N = equivalents of solute ÷ solution volume in litres (eq/L).",
    "example": "A solution containing 0.5 equivalents in 2 litres has N = 0.5 ÷ 2 = 0.25 eq/L.",
    "howTo": [
      "Determine the relevant number of chemical equivalents for your specific reaction.",
      "Enter the equivalents as a nonnegative number.",
      "Enter solution volume in litres greater than zero, then calculate normality in eq/L."
    ],
    "features": [
      "Direct equivalents-per-litre calculation",
      "Explicit eq and L input units",
      "Positive-volume validation"
    ],
    "useCases": [
      "Check textbook equivalent concentration",
      "Practice volumetric solution calculations",
      "Verify a lab-notebook calculation"
    ],
    "limitations": "Normality is reaction dependent. The same solute may have different equivalent factors depending on the reaction. This tool does not determine an equivalent factor or validate a lab procedure.",
    "faq": [
      [
        "Is normality the same as molarity?",
        "No. Molarity uses moles per litre; normality uses equivalents per litre and depends on the reaction."
      ],
      [
        "Can volume be zero?",
        "No. Dividing by zero volume is undefined and the calculator requires positive volume."
      ]
    ]
  },
  "permutation-combination-calculator": {
    "title": "Permutation and Combination Calculator – nPr and nCr",
    "description": "Calculate nPr and nCr from whole-number n and r, and learn when order matters. Inputs are restricted to 0≤r≤n≤170.",
    "intro": "Permutations count ordered selections; combinations count selections where order is irrelevant. Both use the same n and r inputs, but answer different questions. This tool returns both counts so you can see the difference for one example.",
    "formula": "nPr = n! ÷ (n−r)!. nCr = n! ÷ (r! × (n−r)!). The calculator uses a multiplicative loop and accepts integers with 0 ≤ r ≤ n ≤ 170.",
    "example": "Choose two people from five. If first and second positions matter, 5P2 = 5 × 4 = 20 arrangements. If order does not matter, 5C2 = 10 groups.",
    "howTo": [
      "Enter n, the number of available distinct objects, as a whole number from 0 to 170.",
      "Enter r, the number selected, as a whole number between 0 and n.",
      "Read both permutation (ordered) and combination (unordered) counts and choose the one that matches your question."
    ],
    "features": [
      "Calculates permutation and combination counts together",
      "Validates integer n and r ranges",
      "Highlights the order-versus-no-order difference"
    ],
    "useCases": [
      "Solve introductory probability exercises",
      "Count possible team selections",
      "Count rankings or seating selections"
    ],
    "limitations": "Counts assume distinct selectable objects with no replacement. Large results may exceed the precision of ordinary floating-point numeric calculations; the 170 limit is not a promise of exact integer precision for every huge count.",
    "faq": [
      [
        "When do I use nPr?",
        "Use nPr when different orders count as different outcomes, such as awarding first and second place."
      ],
      [
        "When do I use nCr?",
        "Use nCr when the same selected group counts once regardless of its internal order."
      ]
    ]
  },
  "force-calculator": {
    "title": "Force Calculator – Newton's Second Law F = m×a",
    "description": "Calculate net force in newtons from mass in kilograms and acceleration in metres per second squared using F = ma and a worked example.",
    "intro": "Newton's second law connects the net force acting on an object with its mass and acceleration in an inertial reference frame. The calculator multiplies mass in kilograms by signed acceleration in m/s² and returns a force in newtons.",
    "formula": "F = m × a. Mass m is in kilograms; acceleration a is in metres per second squared. One newton is one kg·m/s².",
    "example": "A 5 kg object accelerating at 2 m/s² has net force F = 5 × 2 = 10 N in the acceleration direction.",
    "howTo": [
      "Enter nonnegative mass in kilograms.",
      "Enter signed acceleration in metres per second squared.",
      "Calculate net force and retain the sign to interpret the chosen direction of motion."
    ],
    "features": [
      "Direct force multiplication",
      "SI inputs and newton output",
      "Signed acceleration handling"
    ],
    "useCases": [
      "Practice basic mechanics problems",
      "Check net-force examples",
      "Compare motion at different masses"
    ],
    "limitations": "This is a simple translational net-force model, not a full free-body solver. It does not individually calculate gravity, friction, air drag or tension; those contributions must be considered separately in real systems.",
    "faq": [
      [
        "What does a negative force result mean?",
        "It indicates force in the negative direction of the coordinate convention you chose."
      ],
      [
        "Can I use grams directly?",
        "Convert grams to kilograms first; for example, 500 g is 0.5 kg."
      ]
    ]
  }
};
