export function asFiniteNumber(value) {
  if (value === "" || value === null || value === undefined) throw new Error("Please enter a number.");
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error("Please enter a valid finite number.");
  return n;
}

export function convertLinear(spec, value, fromId, toId) {
  const n = asFiniteNumber(value);
  const from = spec.units?.find((u)=>u.id===fromId), to = spec.units?.find((u)=>u.id===toId);
  if (!from || !to || !Number.isFinite(from.factor) || !Number.isFinite(to.factor) || to.factor===0) throw new Error("Please select valid units.");
  return n * from.factor / to.factor;
}

export function convertTemperature(value, from, to) {
  const n=asFiniteNumber(value);
  let c;
  if(from==="c") c=n;
  else if(from==="f") c=(n-32)*5/9;
  else if(from==="k") c=n-273.15;
  else if(from==="r") c=(n-491.67)*5/9;
  else throw new Error("Please select a valid temperature unit.");
  if (c < -273.1500000001) throw new Error("Temperature cannot be below absolute zero.");
  if(to==="c") return c;
  if(to==="f") return c*9/5+32;
  if(to==="k") return c+273.15;
  if(to==="r") return (c+273.15)*9/5;
  throw new Error("Please select a valid temperature unit.");
}

export const FUEL_TO_L100 = {
  "km-l": (v)=>100/v,
  "l-100km": (v)=>v,
  "mpg-us": (v)=>235.214583/v,
  "mpg-imp": (v)=>282.4809363/v,
};
export const L100_TO_FUEL = {
  "km-l": (v)=>100/v,
  "l-100km": (v)=>v,
  "mpg-us": (v)=>235.214583/v,
  "mpg-imp": (v)=>282.4809363/v,
};
export function convertFuelEconomy(value, from, to){
  const n=asFiniteNumber(value); if(n<=0) throw new Error("Fuel economy must be greater than zero.");
  if(!FUEL_TO_L100[from]||!L100_TO_FUEL[to]) throw new Error("Please select valid fuel economy units.");
  return L100_TO_FUEL[to](FUEL_TO_L100[from](n));
}

export function heightToCm({unit,value,feet,inches}){
  if(unit==="ft-in") { const ft=asFiniteNumber(feet), inch=asFiniteNumber(inches); if(ft<0||inch<0||inch>=12) throw new Error("Use non-negative feet and inches from 0 to under 12."); return (ft*12+inch)*2.54; }
  const n=asFiniteNumber(value); if(n<0) throw new Error("Height cannot be negative.");
  if(unit==="cm") return n; if(unit==="m") return n*100; if(unit==="in") return n*2.54; if(unit==="ft") return n*30.48;
  throw new Error("Please select a valid height unit.");
}
export function cmToHeight(cm, unit){ const n=asFiniteNumber(cm); if(unit==="cm")return n;if(unit==="m")return n/100;if(unit==="in")return n/2.54;if(unit==="ft")return n/30.48;if(unit==="ft-in"){const total=n/2.54,feet=Math.floor(total/12),inches=total-feet*12;return {feet,inches};}throw new Error("Please select a valid height unit."); }


export function calculateBmi({weight,weightUnit="kg",heightUnit="cm",height,feet=0,inches=0}){
  const w=asFiniteNumber(weight);
  if(w<=0) throw new Error("Weight must be greater than zero.");
  const kg=weightUnit==="lb"?w*0.45359237:w;
  let cm;
  if(heightUnit==="ft-in") cm=heightToCm({unit:"ft-in",feet,inches});
  else cm=heightToCm({unit:heightUnit,value:height});
  if(cm<=0) throw new Error("Height must be greater than zero.");
  const bmi=kg/((cm/100)**2);
  return { bmi, kg, cm };
}

export function calculateDuration({days=0,hours=0,minutes=0,seconds=0}){ const total=asFiniteNumber(days)*86400+asFiniteNumber(hours)*3600+asFiniteNumber(minutes)*60+asFiniteNumber(seconds); return {seconds:total,minutes:total/60,hours:total/3600,days:total/86400}; }

export function calculateDownloadTime(sizeValue,sizeUnit,speedValue,speedUnit){
  const size=asFiniteNumber(sizeValue), speed=asFiniteNumber(speedValue); if(size<0||speed<=0) throw new Error("File size must be non-negative and speed must be greater than zero.");
  const sizeBytes={KB:1e3,MB:1e6,GB:1e9,TB:1e12}[sizeUnit]; const speedBps={Kbps:1e3,Mbps:1e6,Gbps:1e9}[speedUnit];
  if(!sizeBytes||!speedBps) throw new Error("Please select valid file-size and speed units."); return size*sizeBytes*8/(speed*speedBps);
}

export function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){[a,b]=[b,a%b]}return a||1;}
export function aspectRatio(width,height){ const w=Math.round(asFiniteNumber(width)),h=Math.round(asFiniteNumber(height)); if(w<=0||h<=0) throw new Error("Width and height must be greater than zero."); const d=gcd(w,h); return `${w/d}:${h/d}`; }

export function numberToRoman(value){ const n=asFiniteNumber(value); if(!Number.isInteger(n)||n<1||n>3999) throw new Error("Enter a whole number from 1 to 3999."); const map=[[1000,"M"],[900,"CM"],[500,"D"],[400,"CD"],[100,"C"],[90,"XC"],[50,"L"],[40,"XL"],[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]]; let x=n,out=""; for(const [v,s] of map) while(x>=v){out+=s;x-=v;} return out; }
export function romanToNumber(value){ const raw=String(value||"").trim().toUpperCase(); if(!/^[IVXLCDM]+$/.test(raw)) throw new Error("Enter a valid Roman numeral using I, V, X, L, C, D and M."); const values={I:1,V:5,X:10,L:50,C:100,D:500,M:1000}; let total=0; for(let i=0;i<raw.length;i++) total+=(values[raw[i]]<values[raw[i+1]]?-1:1)*values[raw[i]]; if(numberToRoman(total)!==raw) throw new Error("Roman numeral is not in canonical valid form."); return total; }

export function convertBase(value, fromBase, toBase){ const raw=String(value??"").trim(); const bases={bin:2,dec:10,oct:8,hex:16}; if(!bases[fromBase]||!bases[toBase]) throw new Error("Please select valid number systems."); const pattern={2:/^[01]+$/,8:/^[0-7]+$/,10:/^[+-]?\d+$/,16:/^[0-9a-f]+$/i}[bases[fromBase]]; if(!pattern.test(raw)) throw new Error(`Invalid ${fromBase} number.`); const n=BigInt(fromBase==="dec"?raw:`0${fromBase==="bin"?"b":fromBase==="oct"?"o":"x"}${raw}`); return n.toString(bases[toBase]).toUpperCase(); }
export function asciiRepresentations(text){ return [...String(text||"")].map((ch)=>{const code=ch.codePointAt(0);return {char:ch,decimal:code,hex:code.toString(16).toUpperCase(),binary:code.toString(2)}}); }

export function decimalToFraction(value,maxDen=1_000_000){ const n=asFiniteNumber(value); if(Number.isInteger(n)) return {numerator:n,denominator:1}; const sign=n<0?-1:1; let x=Math.abs(n),h1=1,h0=0,k1=0,k0=1,b=x; for(let i=0;i<64;i++){const a=Math.floor(b),h2=a*h1+h0,k2=a*k1+k0;if(k2>maxDen)break;h0=h1;h1=h2;k0=k1;k1=k2;const frac=b-a;if(frac<Number.EPSILON)break;b=1/frac;} return {numerator:sign*h1,denominator:k1}; }
export function parseFraction(input){ const raw=String(input||"").trim(); let m=raw.match(/^([+-]?\d+)\s+(\d+)\/(\d+)$/); if(m){const whole=Number(m[1]),num=Number(m[2]),den=Number(m[3]);if(!den)throw new Error("Denominator cannot be zero.");return whole<0?whole-num/den:whole+num/den;} m=raw.match(/^([+-]?\d+)\/(\d+)$/); if(m){const den=Number(m[2]);if(!den)throw new Error("Denominator cannot be zero.");return Number(m[1])/den;} return asFiniteNumber(raw); }

export function convertHealth(value,type,from,to){ const n=asFiniteNumber(value); if(type==="glucose"){ if(from==="mgdl"&&to==="mmoll")return n/18.0182;if(from==="mmoll"&&to==="mgdl")return n*18.0182;} if(type==="cholesterol"){if(from==="mgdl"&&to==="mmoll")return n/38.67;if(from==="mmoll"&&to==="mgdl")return n*38.67;} if(from===to)return n; throw new Error("Please select compatible health units."); }

export function convertConcentration(value,from,to,molarMass){ const n=asFiniteNumber(value); const molar={"mol-l":1,"mmol-l":1e-3}; const mass={"g-l":1,"mg-l":1e-3}; if(from in molar && to in molar)return n*molar[from]/molar[to]; if(from in mass && to in mass)return n*mass[from]/mass[to]; const mm=asFiniteNumber(molarMass); if(mm<=0)throw new Error("Enter molar mass in g/mol for mass ↔ molar conversion."); let molPerL;if(from in molar)molPerL=n*molar[from];else if(from in mass)molPerL=(n*mass[from])/mm;else throw new Error("Invalid concentration unit."); if(to in molar)return molPerL/molar[to];if(to in mass)return molPerL*mm/mass[to];throw new Error("Invalid concentration unit."); }

export function formatNumber(value, precision="auto"){ if(!Number.isFinite(Number(value))) return "—"; const n=Number(value); if(precision==="auto"){ if(n===0)return "0"; const a=Math.abs(n); if(a>=1e9||a<1e-6)return n.toExponential(6).replace(/\.0+e/,"e"); return new Intl.NumberFormat(undefined,{maximumSignificantDigits:10}).format(n); } const p=Math.max(0,Math.min(12,Number(precision)||0)); return n.toLocaleString(undefined,{maximumFractionDigits:p,minimumFractionDigits:0}); }

export function convertLandArea(value, from, to, marlaSqFt=272.25){
  const n=asFiniteNumber(value),m=asFiniteNumber(marlaSqFt);if(m<=0)throw new Error("Marla standard must be greater than zero.");
  const f={ft2:1,yd2:9,m2:10.763910416709722,marla:m,kanal:m*20,acre:43560,ha:107639.1041670972};
  if(!f[from]||!f[to])throw new Error("Please select valid land units.");return n*f[from]/f[to];
}

export function convertTypography(value, from, to, {rootPx=16,emPx=16,dpi=96}={}){
  const n=asFiniteNumber(value),root=asFiniteNumber(rootPx),em=asFiniteNumber(emPx),d=asFiniteNumber(dpi);if(root<=0||em<=0||d<=0)throw new Error("Root font size, em size and DPI must be greater than zero.");
  const toPx={px:v=>v,rem:v=>v*root,em:v=>v*em,pt:v=>v*d/72,cm:v=>v*d/2.54,mm:v=>v*d/25.4};
  const fromPx={px:v=>v,rem:v=>v/root,em:v=>v/em,pt:v=>v*72/d,cm:v=>v*2.54/d,mm:v=>v*25.4/d};
  if(!toPx[from]||!fromPx[to])throw new Error("Please select valid typography units.");return fromPx[to](toPx[from](n));
}

export function convertRadiation(value, group, from, to){
  const sets={dose:{gy:1,mgy:1e-3,ugy:1e-6},equivalent:{sv:1,msv:1e-3,usv:1e-6},activity:{bq:1,kbq:1e3,mbq:1e6,ci:3.7e10}};
  const map=sets[group],n=asFiniteNumber(value);if(!map||!map[from]||!map[to])throw new Error("Radiation units must belong to the same selected dimension.");return n*map[from]/map[to];
}

function parseIsoDateStrict(isoDate){
  const m=String(isoDate||"").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!m) throw new Error("Choose a valid ISO date.");
  const y=+m[1],mo=+m[2],d=+m[3],date=new Date(Date.UTC(y,mo-1,d,12));
  if(date.getUTCFullYear()!==y||date.getUTCMonth()!==mo-1||date.getUTCDate()!==d) throw new Error("Choose a valid calendar date.");
  return date;
}
export function addCalendarUnits(isoDate, amount, unit){
  const n=asFiniteNumber(amount);if(!Number.isInteger(n))throw new Error("Calendar date changes require a whole-number amount.");
  const date=parseIsoDateStrict(isoDate);
  if(unit==="days"||unit==="weeks"){date.setUTCDate(date.getUTCDate()+n*(unit==="weeks"?7:1));}
  else if(unit==="months"){const day=date.getUTCDate();date.setUTCDate(1);date.setUTCMonth(date.getUTCMonth()+n);const last=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0,12)).getUTCDate();date.setUTCDate(Math.min(day,last));}
  else if(unit==="years"){const month=date.getUTCMonth(),day=date.getUTCDate();date.setUTCDate(1);date.setUTCFullYear(date.getUTCFullYear()+n);date.setUTCMonth(month);const last=new Date(Date.UTC(date.getUTCFullYear(),month+1,0,12)).getUTCDate();date.setUTCDate(Math.min(day,last));}
  else throw new Error("Choose days, weeks, months or years.");
  return date.toISOString().slice(0,10);
}
export function dateDifferenceDays(a,b){const da=parseIsoDateStrict(a),db=parseIsoDateStrict(b);return Math.round((db-da)/86400000);}
export function workingDaysBetween(a,b){const da=parseIsoDateStrict(a),db=parseIsoDateStrict(b);let count=0,cur=new Date(da),dir=db>=da?1:-1,guard=0;while((dir>0&&cur<db)||(dir<0&&cur>db)){cur.setUTCDate(cur.getUTCDate()+dir);const day=cur.getUTCDay();if(day!==0&&day!==6)count+=dir;if(++guard>366000)throw new Error("Date range is too large.");}return count;}

function timeZoneParts(date,timeZone){const parts=new Intl.DateTimeFormat("en-CA",{timeZone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(date);return Object.fromEntries(parts.filter(x=>x.type!=="literal").map(x=>[x.type,Number(x.value)]));}
export function zonedWallTimeToUtc(value,timeZone){const [datePart,timePart]=String(value||"").split("T");if(!datePart||!timePart)throw new Error("Choose a date and time.");const[y,m,d]=datePart.split("-").map(Number),[hh,mm]=timePart.split(":").map(Number);let guess=Date.UTC(y,m-1,d,hh,mm,0);for(let i=0;i<4;i++){const p=timeZoneParts(new Date(guess),timeZone),represented=Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second);guess+=Date.UTC(y,m-1,d,hh,mm,0)-represented;}return new Date(guess);}
export function formatInTimeZone(date,timeZone){return new Intl.DateTimeFormat("en-CA",{timeZone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(date);}
