const records = [
  // Physics
  ['velocity-calculator','Velocity Calculator','physics-tools','Calculate velocity from distance and time.','calculator',['velocity','motion','distance time'],'v = d / t'],
  ['force-calculator','Force Calculator','physics-tools','Calculate force from mass and acceleration using Newton’s second law.','calculator',['force','newton','mass acceleration'],'F = ma'],
  ['work-calculator','Work Calculator','physics-tools','Calculate mechanical work from force, displacement and angle.','calculator',['work','mechanics'],'W = Fd cos θ'],
  ['kinetic-energy-calculator','Kinetic Energy Calculator','physics-tools','Calculate translational kinetic energy.','calculator',['kinetic energy','physics'],'KE = ½mv²'],
  ['potential-energy-calculator','Potential Energy Calculator','physics-tools','Calculate gravitational potential energy near Earth’s surface.','calculator',['potential energy','gravity'],'PE = mgh'],
  ['momentum-calculator','Momentum Calculator','physics-tools','Calculate linear momentum from mass and velocity.','calculator',['momentum'],'p = mv'],
  ['physics-density-calculator','Density Calculator','physics-tools','Calculate density from mass and volume.','calculator',['density physics'],'ρ = m/V'],
  ['physics-pressure-calculator','Pressure Calculator','physics-tools','Calculate pressure from normal force and area.','calculator',['pressure force area'],'P = F/A'],
  ['wavelength-calculator','Wavelength Calculator','physics-tools','Calculate wavelength from wave speed and frequency.','calculator',['wavelength','frequency','waves'],'λ = v/f'],
  ['frequency-period-calculator','Frequency & Period Calculator','physics-tools','Convert a period into frequency using the reciprocal relationship.','clock',['frequency','period','waves'],'f = 1/T'],
  ['ohms-law-calculator','Ohm’s Law Calculator','physics-tools','Calculate voltage from current and resistance.','calculator',['ohms law','voltage current resistance'],'V = IR'],
  ['electrical-power-calculator','Electrical Power Calculator','physics-tools','Calculate DC electrical power from voltage and current.','calculator',['electrical power','watts'],'P = VI'],
  ['specific-heat-calculator','Specific Heat Calculator','physics-tools','Calculate sensible heat from mass, specific heat capacity and temperature change.','calculator',['specific heat','thermodynamics'],'Q = mcΔT'],
  ['lens-equation-calculator','Thin Lens Calculator','physics-tools','Calculate focal length from object and image distance using the thin-lens relation.','calculator',['lens equation','optics','focal length'],'1/f = 1/u + 1/v'],

  // Chemistry
  ['molarity-calculator','Molarity Calculator','chemistry-tools','Calculate molar concentration from moles and solution volume.','calculator',['molarity','chemistry','concentration'],'M = n/V'],
  ['molality-calculator','Molality Calculator','chemistry-tools','Calculate molality from moles of solute and kilograms of solvent.','calculator',['molality'],'m = n/kg solvent'],
  ['normality-calculator','Normality Calculator','chemistry-tools','Calculate equivalents per liter for a prepared solution.','calculator',['normality','equivalents'],'N = eq/V'],
  ['dilution-calculator','Dilution Calculator','chemistry-tools','Calculate final concentration using the standard dilution relationship.','calculator',['dilution','c1v1 c2v2'],'C₁V₁ = C₂V₂'],
  ['ph-calculator','pH Calculator','chemistry-tools','Calculate pH from hydrogen ion concentration.','calculator',['ph','hydrogen concentration'],'pH = −log₁₀[H⁺]'],
  ['ideal-gas-law-calculator','Ideal Gas Law Calculator','chemistry-tools','Calculate gas pressure from amount, temperature and volume using the ideal-gas equation.','calculator',['ideal gas','pv nrt','gas law'],'P = nRT/V'],
  ['percent-composition-calculator','Percent Composition Calculator','chemistry-tools','Calculate mass percent of a component in a mixture or compound sample.','percent',['percent composition','chemistry'],'component/total × 100'],

  // Biology
  ['hardy-weinberg-calculator','Hardy-Weinberg Calculator','biology-tools','Calculate expected genotype frequencies from one allele frequency.','calculator',['hardy weinberg','genetics','allele frequency'],'p² + 2pq + q² = 1'],
  ['population-growth-calculator','Population Growth Calculator','biology-tools','Estimate continuous exponential population growth.','calculator',['population growth','biology'],'P(t) = P₀eʳᵗ'],
  ['microscope-magnification-calculator','Microscope Magnification Calculator','biology-tools','Calculate total microscope magnification from eyepiece and objective lenses.','calculator',['microscope','magnification'],'eyepiece × objective'],
  ['dna-complement-tool','DNA Complement Tool','biology-tools','Generate the complementary DNA sequence using base-pair rules.','braces',['dna complement','genetics'],'A↔T, C↔G'],
  ['dna-to-rna-tool','DNA to RNA Tool','biology-tools','Convert a coding DNA sequence to RNA by replacing thymine with uracil.','braces',['dna rna','transcription'],'T → U'],
  ['rna-to-protein-tool','RNA to Protein Helper','biology-tools','Translate complete RNA codons with the standard genetic code until a stop codon.','braces',['rna protein','translation','codon'],'standard genetic code'],
  ['punnett-square-calculator','Punnett Square Calculator','biology-tools','Generate a monohybrid 2×2 Punnett square and genotype frequencies.','calculator',['punnett square','genetics'],'2×2 monohybrid cross'],

  // Mathematics
  ['quadratic-equation-calculator','Quadratic Equation Calculator','mathematics-tools','Solve real or complex roots of ax² + bx + c = 0.','sigma',['quadratic','algebra','roots'],'quadratic formula'],
  ['pythagorean-calculator','Pythagorean Theorem Calculator','mathematics-tools','Calculate the hypotenuse of a right triangle.','sigma',['pythagorean','geometry'],'c = √(a²+b²)'],
  ['vector-magnitude-calculator','Vector Magnitude Calculator','mathematics-tools','Calculate the magnitude of a 3D vector.','sigma',['vector','magnitude'],'|v| = √(x²+y²+z²)'],
  ['permutation-combination-calculator','Permutation & Combination Calculator','mathematics-tools','Calculate nPr and nCr for whole-number selections.','sigma',['permutation','combination','ncr','npr'],'nPr / nCr'],

  // Engineering
  ['stress-calculator','Stress Calculator','engineering-tools','Calculate normal stress from force and cross-sectional area.','calculator',['stress','mechanical engineering'],'σ = F/A'],
  ['strain-calculator','Strain Calculator','engineering-tools','Calculate engineering strain from change in length and original length.','calculator',['strain','mechanical engineering'],'ε = ΔL/L₀'],
  ['voltage-divider-calculator','Voltage Divider Calculator','engineering-tools','Calculate unloaded divider output voltage from two resistors.','calculator',['voltage divider','electronics'],'Vout = Vin R₂/(R₁+R₂)'],
  ['series-resistance-calculator','Series Resistance Calculator','engineering-tools','Calculate total resistance of three series resistors.','calculator',['series resistance','electronics'],'Rtotal = ΣR'],
  ['parallel-resistance-calculator','Parallel Resistance Calculator','engineering-tools','Calculate equivalent resistance of two parallel resistors.','calculator',['parallel resistance','electronics'],'1/R = 1/R₁ + 1/R₂'],
  ['led-resistor-calculator','LED Resistor Calculator','engineering-tools','Estimate a current-limiting resistor for a simple DC LED circuit.','calculator',['led resistor','electronics'],'R = (Vs−Vf)/I'],
  ['rc-time-constant-calculator','RC Time Constant Calculator','engineering-tools','Calculate the RC time constant from resistance and capacitance.','clock',['rc circuit','time constant'],'τ = RC'],
  ['concrete-volume-calculator','Concrete Volume Calculator','engineering-tools','Estimate rectangular concrete volume from dimensions.','calculator',['concrete volume','civil engineering'],'V = LWD'],
  ['slope-gradient-calculator','Slope & Gradient Calculator','engineering-tools','Calculate percentage gradient and slope angle from rise and run.','calculator',['slope','gradient','civil engineering'],'rise/run × 100'],

  // Robotics
  ['gear-ratio-calculator','Gear Ratio Calculator','robotics-tools','Calculate driven-to-driver gear ratio from tooth counts.','calculator',['gear ratio','robotics'],'driven/driver'],
  ['wheel-speed-calculator','Wheel Speed Calculator','robotics-tools','Calculate robot linear speed from wheel diameter and RPM.','calculator',['wheel speed','robotics','rpm'],'v = πd·RPM/60'],
  ['battery-runtime-calculator','Battery Runtime Estimator','robotics-tools','Estimate runtime from battery capacity, load current and usable-capacity percentage.','calculator',['battery runtime','robotics'],'Ah × efficiency / A'],
  ['pwm-duty-cycle-calculator','PWM Duty Cycle Calculator','robotics-tools','Calculate PWM duty cycle from on-time and off-time.','percent',['pwm','duty cycle','robotics'],'Ton/(Ton+Toff) × 100'],

  // Business & finance additions
  ['break-even-calculator','Break-even Calculator','finance-tools','Estimate break-even sales quantity from fixed cost and unit contribution.','briefcase-business',['break even','business'],'fixed / (price − variable)'],
  ['cagr-calculator','CAGR Calculator','finance-tools','Calculate compound annual growth rate between two positive values.','percent',['cagr','growth rate','finance'],'(end/start)^(1/years)−1'],
  ['roi-calculator','ROI Calculator','finance-tools','Calculate return on investment as a percentage of investment cost.','percent',['roi','return on investment'],'(gain−cost)/cost × 100'],
  ['commission-calculator','Commission Calculator','finance-tools','Calculate commission amount from sales and percentage rate.','percent',['commission','sales'],'sales × rate / 100'],
];

export const formulaToolRecords = records.map(([id,name,category,description,icon,keywords,formula]) => ({
  id, name, category, description, icon, keywords, formula,
  aliases: [], tags: ['formula','calculator'], status:'active', processingType:'browser', requiresBackend:false, requiresInternet:false,
  seoTitle: `${name} Online | MZ Smart Tool House`,
  seoDescription: `${description} Uses a validated browser-side formula with clear inputs, units and result.`,
}));
export const formulaToolIds = formulaToolRecords.map((tool)=>tool.id);
