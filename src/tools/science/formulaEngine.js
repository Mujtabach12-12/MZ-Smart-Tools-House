const EPS = 1e-12;

function requireNumber(values, key, label = key) {
  const raw = values[key];
  if (raw === '' || raw === null || raw === undefined) throw new Error(`Please enter ${label}.`);
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error(`${label} must be a valid number.`);
  return n;
}
function positive(values, key, label = key, { allowZero = false } = {}) {
  const n = requireNumber(values, key, label);
  if (allowZero ? n < 0 : n <= 0) throw new Error(`${label} must be ${allowZero ? 'zero or greater' : 'greater than zero'}.`);
  return n;
}
function nonNegative(values, key, label = key) { return positive(values, key, label, { allowZero: true }); }
function inRange(values, key, label, min, max) {
  const n = requireNumber(values, key, label);
  if (n < min || n > max) throw new Error(`${label} must be between ${min} and ${max}.`);
  return n;
}
function integer(values, key, label, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const n = requireNumber(values, key, label);
  if (!Number.isInteger(n) || n < min || n > max) throw new Error(`${label} must be a whole number between ${min} and ${max}.`);
  return n;
}
export function formatNumber(value, digits = 6) {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if ((abs !== 0 && abs < 1e-6) || abs >= 1e9) return value.toExponential(Math.min(6, digits));
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(value);
}
function numericResult(value, unit = '', label = 'Result', details = []) {
  return { value, unit, label, display: `${formatNumber(value)}${unit ? ` ${unit}` : ''}`, details };
}
function textResult(display, details = []) { return { display, details }; }

const CODON_TABLE = {
  UUU:'F',UUC:'F',UUA:'L',UUG:'L',UCU:'S',UCC:'S',UCA:'S',UCG:'S',UAU:'Y',UAC:'Y',UAA:'Stop',UAG:'Stop',UGU:'C',UGC:'C',UGA:'Stop',UGG:'W',
  CUU:'L',CUC:'L',CUA:'L',CUG:'L',CCU:'P',CCC:'P',CCA:'P',CCG:'P',CAU:'H',CAC:'H',CAA:'Q',CAG:'Q',CGU:'R',CGC:'R',CGA:'R',CGG:'R',
  AUU:'I',AUC:'I',AUA:'I',AUG:'M',ACU:'T',ACC:'T',ACA:'T',ACG:'T',AAU:'N',AAC:'N',AAA:'K',AAG:'K',AGU:'S',AGC:'S',AGA:'R',AGG:'R',
  GUU:'V',GUC:'V',GUA:'V',GUG:'V',GCU:'A',GCC:'A',GCA:'A',GCG:'A',GAU:'D',GAC:'D',GAA:'E',GAG:'E',GGU:'G',GGC:'G',GGA:'G',GGG:'G',
};

export const formulaDefinitions = {
  // Physics
  'velocity-calculator': { formula:'v = d / t', fields:[['distance','Distance','number','m'],['time','Time','number','s']], calculate:v=>numericResult(requireNumber(v,'distance','Distance')/positive(v,'time','Time'),'m/s','Velocity') },
  'force-calculator': { formula:'F = m × a', fields:[['mass','Mass','number','kg'],['acceleration','Acceleration','number','m/s²']], calculate:v=>numericResult(nonNegative(v,'mass','Mass')*requireNumber(v,'acceleration','Acceleration'),'N','Force') },
  'work-calculator': { formula:'W = F × d × cos(θ)', fields:[['force','Force','number','N'],['distance','Distance','number','m'],['angle','Angle','number','°']], calculate:v=>{const F=requireNumber(v,'force','Force'),d=nonNegative(v,'distance','Distance'),a=requireNumber(v,'angle','Angle');return numericResult(F*d*Math.cos(a*Math.PI/180),'J','Work')} },
  'kinetic-energy-calculator': { formula:'KE = ½mv²', fields:[['mass','Mass','number','kg'],['velocity','Velocity','number','m/s']], calculate:v=>numericResult(0.5*nonNegative(v,'mass','Mass')*requireNumber(v,'velocity','Velocity')**2,'J','Kinetic energy') },
  'potential-energy-calculator': { formula:'PE = mgh (g = 9.80665 m/s²)', fields:[['mass','Mass','number','kg'],['height','Height','number','m']], calculate:v=>numericResult(nonNegative(v,'mass','Mass')*9.80665*requireNumber(v,'height','Height'),'J','Gravitational potential energy') },
  'momentum-calculator': { formula:'p = mv', fields:[['mass','Mass','number','kg'],['velocity','Velocity','number','m/s']], calculate:v=>numericResult(nonNegative(v,'mass','Mass')*requireNumber(v,'velocity','Velocity'),'kg·m/s','Momentum') },
  'physics-density-calculator': { formula:'ρ = m / V', fields:[['mass','Mass','number','kg'],['volume','Volume','number','m³']], calculate:v=>numericResult(nonNegative(v,'mass','Mass')/positive(v,'volume','Volume'),'kg/m³','Density') },
  'physics-pressure-calculator': { formula:'P = F / A', fields:[['force','Force','number','N'],['area','Area','number','m²']], calculate:v=>numericResult(requireNumber(v,'force','Force')/positive(v,'area','Area'),'Pa','Pressure') },
  'wavelength-calculator': { formula:'λ = v / f', fields:[['speed','Wave speed','number','m/s'],['frequency','Frequency','number','Hz']], calculate:v=>numericResult(positive(v,'speed','Wave speed')/positive(v,'frequency','Frequency'),'m','Wavelength') },
  'frequency-period-calculator': { formula:'f = 1 / T', fields:[['period','Period','number','s']], calculate:v=>numericResult(1/positive(v,'period','Period'),'Hz','Frequency') },
  'ohms-law-calculator': { formula:'V = I × R', fields:[['current','Current','number','A'],['resistance','Resistance','number','Ω']], calculate:v=>numericResult(requireNumber(v,'current','Current')*nonNegative(v,'resistance','Resistance'),'V','Voltage') },
  'electrical-power-calculator': { formula:'P = V × I', fields:[['voltage','Voltage','number','V'],['current','Current','number','A']], calculate:v=>numericResult(requireNumber(v,'voltage','Voltage')*requireNumber(v,'current','Current'),'W','Electrical power') },
  'specific-heat-calculator': { formula:'Q = m × c × ΔT', fields:[['mass','Mass','number','kg'],['specificHeat','Specific heat capacity','number','J/(kg·K)'],['temperatureChange','Temperature change ΔT','number','K']], calculate:v=>numericResult(nonNegative(v,'mass','Mass')*nonNegative(v,'specificHeat','Specific heat capacity')*requireNumber(v,'temperatureChange','Temperature change'),'J','Heat energy') },
  'lens-equation-calculator': { formula:'1/f = 1/u + 1/v', fields:[['objectDistance','Object distance u','number','m'],['imageDistance','Image distance v','number','m']], calculate:v=>{const u=requireNumber(v,'objectDistance','Object distance'),i=requireNumber(v,'imageDistance','Image distance');if(Math.abs(u+i)<EPS)throw new Error('Object distance + image distance cannot be zero.');return numericResult(u*i/(u+i),'m','Focal length')} },

  // Chemistry
  'molarity-calculator': { formula:'M = n / V', fields:[['moles','Amount of solute','number','mol'],['volume','Solution volume','number','L']], calculate:v=>numericResult(nonNegative(v,'moles','Moles')/positive(v,'volume','Solution volume'),'mol/L','Molarity') },
  'molality-calculator': { formula:'m = n / mass(solvent)', fields:[['moles','Amount of solute','number','mol'],['solventMass','Solvent mass','number','kg']], calculate:v=>numericResult(nonNegative(v,'moles','Moles')/positive(v,'solventMass','Solvent mass'),'mol/kg','Molality') },
  'normality-calculator': { formula:'N = equivalents / V', fields:[['equivalents','Equivalents','number','eq'],['volume','Solution volume','number','L']], calculate:v=>numericResult(nonNegative(v,'equivalents','Equivalents')/positive(v,'volume','Solution volume'),'eq/L','Normality') },
  'dilution-calculator': { formula:'C₁V₁ = C₂V₂ → C₂ = C₁V₁/V₂', fields:[['c1','Initial concentration C₁','number',''],['v1','Initial volume V₁','number','mL'],['v2','Final volume V₂','number','mL']], calculate:v=>numericResult(nonNegative(v,'c1','Initial concentration')*nonNegative(v,'v1','Initial volume')/positive(v,'v2','Final volume'),'','Final concentration C₂') },
  'ph-calculator': { formula:'pH = −log₁₀[H⁺]', fields:[['hydrogen','Hydrogen ion concentration [H⁺]','number','mol/L']], calculate:v=>numericResult(-Math.log10(positive(v,'hydrogen','Hydrogen ion concentration')),'','pH') },
  'ideal-gas-law-calculator': { formula:'P = nRT / V, R = 8.314462618 J/(mol·K)', fields:[['moles','Amount n','number','mol'],['temperature','Temperature T','number','K'],['volume','Volume V','number','m³']], calculate:v=>{const n=nonNegative(v,'moles','Amount'),T=positive(v,'temperature','Temperature'),V=positive(v,'volume','Volume');return numericResult(n*8.314462618*T/V,'Pa','Pressure',[`≈ ${formatNumber(n*8.314462618*T/V/1000)} kPa`])} },
  'percent-composition-calculator': { formula:'% composition = component mass / total mass × 100', fields:[['componentMass','Component mass','number','g'],['totalMass','Total mass','number','g']], calculate:v=>{const c=nonNegative(v,'componentMass','Component mass'),t=positive(v,'totalMass','Total mass');if(c>t)throw new Error('Component mass cannot exceed total mass.');return numericResult(c/t*100,'%','Percent composition')} },

  // Biology
  'hardy-weinberg-calculator': { formula:'p + q = 1; p² + 2pq + q² = 1', fields:[['p','Dominant allele frequency p','number','0–1']], calculate:v=>{const p=inRange(v,'p','Allele frequency p',0,1),q=1-p;return textResult(`p² = ${formatNumber(p*p,4)}, 2pq = ${formatNumber(2*p*q,4)}, q² = ${formatNumber(q*q,4)}`,[`q = ${formatNumber(q,4)}`])} },
  'population-growth-calculator': { formula:'P(t) = P₀eʳᵗ', fields:[['initial','Initial population P₀','number',''],['rate','Continuous growth rate r','number','per time unit'],['time','Time t','number','']], calculate:v=>numericResult(nonNegative(v,'initial','Initial population')*Math.exp(requireNumber(v,'rate','Growth rate')*nonNegative(v,'time','Time')),'','Estimated population') },
  'microscope-magnification-calculator': { formula:'Total magnification = eyepiece × objective', fields:[['eyepiece','Eyepiece magnification','number','×'],['objective','Objective magnification','number','×']], calculate:v=>numericResult(positive(v,'eyepiece','Eyepiece magnification')*positive(v,'objective','Objective magnification'),'×','Total magnification') },
  'dna-complement-tool': { formula:'A ↔ T, C ↔ G', fields:[['sequence','DNA sequence','text','A/T/C/G']], calculate:v=>{const s=String(v.sequence||'').replace(/\s+/g,'').toUpperCase();if(!s)throw new Error('Please enter a DNA sequence.');if(!/^[ATCG]+$/.test(s))throw new Error('DNA sequence can contain only A, T, C and G.');const map={A:'T',T:'A',C:'G',G:'C'};return textResult([...s].map(ch=>map[ch]).join(''))} },
  'dna-to-rna-tool': { formula:'Coding DNA → RNA: T is replaced with U', fields:[['sequence','Coding DNA sequence','text','A/T/C/G']], calculate:v=>{const s=String(v.sequence||'').replace(/\s+/g,'').toUpperCase();if(!s)throw new Error('Please enter a DNA sequence.');if(!/^[ATCG]+$/.test(s))throw new Error('DNA sequence can contain only A, T, C and G.');return textResult(s.replace(/T/g,'U'))} },
  'rna-to-protein-tool': { formula:'Standard genetic code; translation proceeds codon by codon until Stop', fields:[['sequence','RNA sequence','text','A/U/C/G']], calculate:v=>{const s=String(v.sequence||'').replace(/\s+/g,'').toUpperCase();if(!s)throw new Error('Please enter an RNA sequence.');if(!/^[AUCG]+$/.test(s))throw new Error('RNA sequence can contain only A, U, C and G.');if(s.length<3)throw new Error('Enter at least one complete codon (3 bases).');const amino=[];const codons=[];for(let i=0;i+2<s.length;i+=3){const c=s.slice(i,i+3),aa=CODON_TABLE[c];codons.push(c);if(aa==='Stop'){amino.push('Stop');break;}amino.push(aa)}return textResult(amino.join('–'),[`Codons: ${codons.join(' ')}`, s.length%3 ? `${s.length%3} trailing base(s) were not translated.` : 'Complete codons translated.'])} },
  'punnett-square-calculator': { formula:'Monohybrid 2×2 Punnett square', fields:[['parent1','Parent 1 genotype','text','e.g. Aa'],['parent2','Parent 2 genotype','text','e.g. Aa']], calculate:v=>{const p1=String(v.parent1||'').trim(),p2=String(v.parent2||'').trim();if(!/^[A-Za-z]{2}$/.test(p1)||!/^[A-Za-z]{2}$/.test(p2))throw new Error('Each parent genotype must contain exactly two allele letters, for example Aa.');const gene=(p1+p2).toLowerCase();if([...gene].some(ch=>ch!==gene[0]))throw new Error('Use alleles for one gene only, for example A/a.');const children=[p1[0]+p2[0],p1[0]+p2[1],p1[1]+p2[0],p1[1]+p2[1]].map(g=>[...g].sort((a,b)=>a===a.toUpperCase()?-1:1).join(''));const counts={};children.forEach(g=>counts[g]=(counts[g]||0)+1);return textResult(children.join(' · '),Object.entries(counts).map(([g,n])=>`${g}: ${n}/4 (${n*25}%)`))} },

  // Mathematics
  'quadratic-equation-calculator': { formula:'x = (−b ± √(b²−4ac)) / 2a', fields:[['a','a','number',''],['b','b','number',''],['c','c','number','']], calculate:v=>{const a=requireNumber(v,'a','a'),b=requireNumber(v,'b','b'),c=requireNumber(v,'c','c');if(Math.abs(a)<EPS)throw new Error('a cannot be zero for a quadratic equation.');const d=b*b-4*a*c;if(d>=0){const r=Math.sqrt(d);return textResult(`x₁ = ${formatNumber((-b+r)/(2*a))}, x₂ = ${formatNumber((-b-r)/(2*a))}`,[`Discriminant = ${formatNumber(d)}`])}const real=-b/(2*a),imag=Math.sqrt(-d)/(2*Math.abs(a));return textResult(`x₁ = ${formatNumber(real)} + ${formatNumber(imag)}i, x₂ = ${formatNumber(real)} − ${formatNumber(imag)}i`,[`Discriminant = ${formatNumber(d)}`])} },
  'pythagorean-calculator': { formula:'c = √(a² + b²)', fields:[['a','Side a','number',''],['b','Side b','number','']], calculate:v=>numericResult(Math.hypot(nonNegative(v,'a','Side a'),nonNegative(v,'b','Side b')),'','Hypotenuse c') },
  'vector-magnitude-calculator': { formula:'|v| = √(x² + y² + z²)', fields:[['x','x','number',''],['y','y','number',''],['z','z','number','']], calculate:v=>numericResult(Math.hypot(requireNumber(v,'x','x'),requireNumber(v,'y','y'),requireNumber(v,'z','z')),'','Vector magnitude') },
  'permutation-combination-calculator': { formula:'nPr = n!/(n−r)!, nCr = n!/[r!(n−r)!]', fields:[['n','n','number','whole number'],['r','r','number','whole number']], calculate:v=>{const n=integer(v,'n','n',0,170),r=integer(v,'r','r',0,n);let perm=1,comb=1;for(let i=0;i<r;i++){perm*=n-i;comb*=((n-i)/(i+1));}return textResult(`nPr = ${formatNumber(perm)}, nCr = ${formatNumber(comb)}`)} },

  // Engineering & robotics
  'stress-calculator': { formula:'σ = F / A', fields:[['force','Force','number','N'],['area','Cross-sectional area','number','m²']], calculate:v=>numericResult(requireNumber(v,'force','Force')/positive(v,'area','Area'),'Pa','Stress') },
  'strain-calculator': { formula:'ε = ΔL / L₀', fields:[['change','Change in length ΔL','number','m'],['original','Original length L₀','number','m']], calculate:v=>numericResult(requireNumber(v,'change','Change in length')/positive(v,'original','Original length'),'','Strain') },
  'voltage-divider-calculator': { formula:'Vout = Vin × R₂/(R₁+R₂)', fields:[['vin','Input voltage Vin','number','V'],['r1','R₁','number','Ω'],['r2','R₂','number','Ω']], calculate:v=>{const vin=requireNumber(v,'vin','Input voltage'),r1=nonNegative(v,'r1','R₁'),r2=nonNegative(v,'r2','R₂');if(r1+r2<=0)throw new Error('R₁ + R₂ must be greater than zero.');return numericResult(vin*r2/(r1+r2),'V','Output voltage')} },
  'series-resistance-calculator': { formula:'Rtotal = R₁ + R₂ + R₃', fields:[['r1','R₁','number','Ω'],['r2','R₂','number','Ω'],['r3','R₃','number','Ω']], calculate:v=>numericResult(nonNegative(v,'r1','R₁')+nonNegative(v,'r2','R₂')+nonNegative(v,'r3','R₃'),'Ω','Series resistance') },
  'parallel-resistance-calculator': { formula:'1/Rtotal = 1/R₁ + 1/R₂', fields:[['r1','R₁','number','Ω'],['r2','R₂','number','Ω']], calculate:v=>{const r1=positive(v,'r1','R₁'),r2=positive(v,'r2','R₂');return numericResult(1/(1/r1+1/r2),'Ω','Parallel resistance')} },
  'led-resistor-calculator': { formula:'R = (Vs − Vf) / I', fields:[['supply','Supply voltage Vs','number','V'],['forward','LED forward voltage Vf','number','V'],['currentMa','Desired current','number','mA']], calculate:v=>{const vs=positive(v,'supply','Supply voltage'),vf=nonNegative(v,'forward','Forward voltage'),i=positive(v,'currentMa','Current')/1000;if(vs<=vf)throw new Error('Supply voltage must be greater than LED forward voltage.');return numericResult((vs-vf)/i,'Ω','Series resistor')} },
  'rc-time-constant-calculator': { formula:'τ = R × C', fields:[['resistance','Resistance R','number','Ω'],['capacitanceUf','Capacitance C','number','µF']], calculate:v=>numericResult(positive(v,'resistance','Resistance')*positive(v,'capacitanceUf','Capacitance')*1e-6,'s','RC time constant') },
  'gear-ratio-calculator': { formula:'Gear ratio = driven teeth / driver teeth', fields:[['driver','Driver gear teeth','number','teeth'],['driven','Driven gear teeth','number','teeth']], calculate:v=>numericResult(positive(v,'driven','Driven teeth')/positive(v,'driver','Driver teeth'),'','Gear ratio') },
  'wheel-speed-calculator': { formula:'v = π × diameter × RPM / 60', fields:[['diameter','Wheel diameter','number','m'],['rpm','Wheel speed','number','RPM']], calculate:v=>{const ms=Math.PI*positive(v,'diameter','Wheel diameter')*nonNegative(v,'rpm','RPM')/60;return numericResult(ms,'m/s','Linear speed',[`${formatNumber(ms*3.6)} km/h`])} },
  'battery-runtime-calculator': { formula:'Runtime ≈ capacity(Ah) × efficiency / current(A)', fields:[['capacity','Battery capacity','number','Ah'],['current','Load current','number','A'],['efficiency','Usable capacity','number','%']], calculate:v=>numericResult(positive(v,'capacity','Battery capacity')*(inRange(v,'efficiency','Usable capacity',1,100)/100)/positive(v,'current','Load current'),'h','Estimated runtime') },
  'pwm-duty-cycle-calculator': { formula:'Duty cycle = Ton/(Ton + Toff) × 100', fields:[['onTime','On time','number','ms'],['offTime','Off time','number','ms']], calculate:v=>{const on=nonNegative(v,'onTime','On time'),off=nonNegative(v,'offTime','Off time');if(on+off<=0)throw new Error('On time + off time must be greater than zero.');return numericResult(on/(on+off)*100,'%','Duty cycle')} },
  'concrete-volume-calculator': { formula:'Volume = length × width × depth', fields:[['length','Length','number','m'],['width','Width','number','m'],['depth','Depth','number','m']], calculate:v=>numericResult(positive(v,'length','Length')*positive(v,'width','Width')*positive(v,'depth','Depth'),'m³','Concrete volume') },
  'slope-gradient-calculator': { formula:'Gradient = rise/run × 100', fields:[['rise','Rise','number','m'],['run','Run','number','m']], calculate:v=>{const rise=requireNumber(v,'rise','Rise'),run=positive(v,'run','Run'),ratio=rise/run;return numericResult(ratio*100,'%','Gradient',[`Angle ≈ ${formatNumber(Math.atan(ratio)*180/Math.PI)}°`])} },

  // Business additions
  'break-even-calculator': { formula:'Break-even units = fixed costs / (price − variable cost)', fields:[['fixed','Fixed costs','number',''],['price','Selling price per unit','number',''],['variable','Variable cost per unit','number','']], calculate:v=>{const fixed=nonNegative(v,'fixed','Fixed costs'),price=requireNumber(v,'price','Selling price'),variable=nonNegative(v,'variable','Variable cost');if(price<=variable)throw new Error('Selling price must be greater than variable cost per unit.');return numericResult(fixed/(price-variable),'units','Break-even quantity')} },
  'cagr-calculator': { formula:'CAGR = (Ending / Beginning)^(1/years) − 1', fields:[['start','Beginning value','number',''],['end','Ending value','number',''],['years','Years','number','']], calculate:v=>numericResult(((positive(v,'end','Ending value')/positive(v,'start','Beginning value'))**(1/positive(v,'years','Years'))-1)*100,'%','CAGR') },
  'roi-calculator': { formula:'ROI = (gain − cost) / cost × 100', fields:[['gain','Final value / return','number',''],['cost','Investment cost','number','']], calculate:v=>numericResult((requireNumber(v,'gain','Final value')-positive(v,'cost','Investment cost'))/positive(v,'cost','Investment cost')*100,'%','ROI') },
  'commission-calculator': { formula:'Commission = sales × rate / 100', fields:[['sales','Sales amount','number',''],['rate','Commission rate','number','%']], calculate:v=>numericResult(nonNegative(v,'sales','Sales amount')*nonNegative(v,'rate','Commission rate')/100,'','Commission') },
};

export function calculateFormulaTool(id, values) {
  const def = formulaDefinitions[id];
  if (!def) throw new Error(`Unknown formula tool: ${id}`);
  return def.calculate(values);
}
