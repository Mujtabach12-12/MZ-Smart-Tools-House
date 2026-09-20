import { useMemo, useState } from "react";
import { Plus, Trash2, RotateCcw, Search, ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";
import CalculatorShell from "../../components/tools/CalculatorShell";
import ErrorBanner from "../../components/tools/ErrorBanner";
import ResultCard, { ResultRow } from "../../components/tools/ResultCard";
import { universityPolicies, getUniversityPolicy } from "../../data/universities/policies";
import { calculateCgpaFromSemesters, calculateGpa } from "../../lib/calculators/universityGpa";
import Seo, { BASE_URL } from "../../components/layout/Seo";

const requested = universityPolicies;
const emptyCourse = (policy, mode = "grade") => ({ id: crypto.randomUUID(), name: "", courseCode: "", creditHours: "3", marks: "", grade: policy?.grades?.[0]?.letter || "", mode });
const emptySemester = () => ({ id: crypto.randomUUID(), label: "", gpa: "", creditHours: "" });

function normalize(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, ""); }
function score(query, item) {
  const q = normalize(query); if (!q) return 0;
  const hay = [item.name, item.shortName, item.city].map(normalize);
  if (hay.some((x) => x === q)) return 100;
  if (hay.some((x) => x.startsWith(q))) return 80;
  if (hay.some((x) => x.includes(q))) return 60;
  let pos = 0; let hits = 0;
  for (const ch of q) { const i = hay[0].indexOf(ch, pos); if (i < 0) break; hits++; pos = i + 1; }
  return hits / q.length * 40;
}

function PolicyPanel({ policy }) {
  const verified = policy?.grades?.length && policy?.sourceUrl;
  return (
    <div className="mz-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300">Your University's GPA Policy</p>
          <h2 className="mt-1 text-xl font-bold text-navy-900 dark:text-white">{policy.name}</h2>
        </div>
        {verified ? <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-500" aria-label="Verified policy"/> : <ShieldAlert className="h-6 w-6 shrink-0 text-amber-500" aria-label="Policy verification required"/>}
      </div>
      {verified ? (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-navy-50 p-3 dark:bg-navy-900/60"><div className="text-xs text-navy-500">Grading Type</div><div className="mt-1 font-semibold text-navy-900 dark:text-white">{policy.gradingType}</div></div>
            <div className="rounded-xl bg-navy-50 p-3 dark:bg-navy-900/60"><div className="text-xs text-navy-500">GPA Scale</div><div className="mt-1 font-semibold text-navy-900 dark:text-white">{policy.maxGPA.toFixed(2)}</div></div>
            <div className="rounded-xl bg-navy-50 p-3 dark:bg-navy-900/60"><div className="text-xs text-navy-500">Passing Grade</div><div className="mt-1 font-semibold text-navy-900 dark:text-white">{policy.minimumPassingGrade} ({policy.minimumPassingPoint})</div></div>
          </div>
          <div className="mt-5 overflow-x-auto rounded-xl border border-navy-100 dark:border-navy-800">
            <table className="min-w-full text-sm"><thead className="bg-navy-50 text-left dark:bg-navy-900"><tr><th className="px-4 py-3">Grade</th><th className="px-4 py-3">Marks</th><th className="px-4 py-3">Grade Point</th></tr></thead><tbody>{policy.grades.map((g) => <tr key={g.letter} className="border-t border-navy-100 dark:border-navy-800"><td className="px-4 py-2.5 font-semibold text-navy-900 dark:text-white">{g.letter}</td><td className="px-4 py-2.5 text-navy-500">{g.minPercentage == null ? "—" : `${g.minPercentage}${g.maxPercentage != null && g.maxPercentage !== g.minPercentage ? `–${g.maxPercentage}` : "+"}%`}</td><td className="px-4 py-2.5 font-semibold text-brand-700 dark:text-brand-300">{Number(g.gradePoint).toFixed(2)}</td></tr>)}</tbody></table>
          </div>
          <div className="mt-4 space-y-2 text-sm text-navy-600 dark:text-navy-300">
            <p><strong>Repeat policy:</strong> {policy.repeatPolicy || "Check current university regulations."}</p>
            <p><strong>Grade replacement:</strong> {policy.gradeReplacementPolicy || "Check current university regulations."}</p>
            <p><strong>Policy Source:</strong> <a className="text-brand-600 hover:underline" href={policy.sourceUrl} target="_blank" rel="noreferrer">{policy.sourceTitle || "Official university policy"}</a></p>
            <p><strong>Last Verified:</strong> {policy.lastVerified}</p>
          </div>
        </>
      ) : (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
          <strong>Policy verification required.</strong> A reliable current official grading table was not verified for this university/program in this release. MZ Smart Tool House will not silently apply a generic 4.0 scale. Use the Custom Scale option below or provide the current program/batch regulations.
        </div>
      )}
    </div>
  );
}

function UniversityPicker({ onContinue, onCustom }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  const results = useMemo(() => requested.map((u) => ({ ...u, _score: score(query, u) })).filter((u) => !query || u._score > 0).sort((a,b)=>b._score-a._score), [query]);
  return <div className="mx-auto max-w-3xl">
    <div className="mz-card p-6 sm:p-8">
      <div className="text-center"><div className="mx-auto inline-flex rounded-2xl bg-brand-50 p-3 text-brand-700 dark:bg-brand-950 dark:text-brand-300"><Search className="h-6 w-6"/></div><h1 className="mt-4 text-2xl font-bold text-navy-900 dark:text-white">Enter Your University / Institute Name</h1><p className="mt-2 text-sm text-navy-500 dark:text-navy-400">Choose your institution first. We will load its verified grading policy instead of assuming a generic scale.</p></div>
      <label className="mt-7 block text-sm font-semibold text-navy-800 dark:text-navy-100">Search University
        <input autoFocus value={query} onChange={(e)=>setQuery(e.target.value)} className="mz-input mt-2" placeholder="Try UOL, COMSATS, FAST, PU, Lahore…"/>
      </label>
      <div className="mt-3 max-h-80 overflow-y-auto rounded-xl border border-navy-100 dark:border-navy-800">
        {results.map((u)=><button type="button" key={u.id} onClick={()=>setSelected(u.id)} className={`flex w-full items-center justify-between gap-3 border-b border-navy-100 px-4 py-3 text-left last:border-b-0 dark:border-navy-800 ${selected===u.id?"bg-brand-50 dark:bg-brand-950/40":"hover:bg-navy-50 dark:hover:bg-navy-900/60"}`}><span><span className="block font-semibold text-navy-900 dark:text-white">{u.name}</span><span className="text-xs text-navy-500">{u.shortName}{u.city?` · ${u.city}`:""}</span></span>{u.verified?<span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">Verified</span>:<span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">Verify</span>}</button>)}
        {!results.length && <div className="p-5 text-center text-sm text-navy-500">No matching university found.</div>}
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <input className="mz-input" placeholder="Institute / Campus (Optional)" id="campus"/>
        <input className="mz-input" placeholder="Program / Department (Optional)" id="program"/>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row"><button type="button" disabled={!selected} onClick={()=>onContinue(selected, document.getElementById("campus")?.value || "", document.getElementById("program")?.value || "")} className="mz-btn-primary flex-1 disabled:opacity-40">Continue →</button><button type="button" onClick={onCustom} className="mz-btn-secondary flex-1">Create Custom Grading Scale</button></div>
    </div>
  </div>;
}

function CustomScale({ onSave }) {
  const [name,setName]=useState(""); const [scale,setScale]=useState("4"); const [grades,setGrades]=useState([{id:crypto.randomUUID(),letter:"A",min:"85",max:"100",point:"4"},{id:crypto.randomUUID(),letter:"B",min:"70",max:"84",point:"3"},{id:crypto.randomUUID(),letter:"C",min:"60",max:"69",point:"2"},{id:crypto.randomUUID(),letter:"D",min:"50",max:"59",point:"1"},{id:crypto.randomUUID(),letter:"F",min:"0",max:"49",point:"0"}]);
  return <div className="mz-card p-6"><div><span className="mz-badge">Custom Scale — Not Officially Verified</span><h2 className="mt-2 text-xl font-bold text-navy-900 dark:text-white">Create Custom Grading Scale</h2></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><input className="mz-input" placeholder="University Name" value={name} onChange={e=>setName(e.target.value)}/><input className="mz-input" type="number" min="1" step="0.01" placeholder="GPA Scale" value={scale} onChange={e=>setScale(e.target.value)}/></div><div className="mt-4 space-y-2">{grades.map((g,i)=><div key={g.id} className="grid grid-cols-4 gap-2"><input className="mz-input" placeholder="Grade" value={g.letter} onChange={e=>setGrades(x=>x.map((r,j)=>j===i?{...r,letter:e.target.value}:r))}/><input className="mz-input" type="number" placeholder="Min %" value={g.min} onChange={e=>setGrades(x=>x.map((r,j)=>j===i?{...r,min:e.target.value}:r))}/><input className="mz-input" type="number" placeholder="Max %" value={g.max} onChange={e=>setGrades(x=>x.map((r,j)=>j===i?{...r,max:e.target.value}:r))}/><div className="flex gap-1"><input className="mz-input" type="number" step="0.01" placeholder="Point" value={g.point} onChange={e=>setGrades(x=>x.map((r,j)=>j===i?{...r,point:e.target.value}:r))}/><button className="mz-btn-ghost" type="button" onClick={()=>setGrades(x=>x.filter((_,j)=>j!==i))}><Trash2 className="h-4 w-4"/></button></div></div>)}</div><button type="button" className="mz-btn-secondary mt-3" onClick={()=>setGrades(x=>[...x,{id:crypto.randomUUID(),letter:"",min:"",max:"",point:""}])}><Plus className="h-4 w-4"/> Add Grade</button><div className="mt-5"><button type="button" className="mz-btn-primary" disabled={!name.trim() || !grades.length} onClick={()=>onSave({id:"custom",name:name.trim(),shortName:"Custom",scale:Number(scale)||4,gradingType:"custom",maxGPA:Number(scale)||4,minimumPassingGrade:"—",minimumPassingPoint:null,grades:grades.map(g=>({letter:g.letter.trim().toUpperCase(),minPercentage:Number(g.min),maxPercentage:Number(g.max),gradePoint:Number(g.point)})).filter(g=>g.letter),specialGrades:[],repeatPolicy:"Custom scale: verify your university's repeat policy.",gradeReplacementPolicy:"Custom scale: verify your university's replacement policy.",sourceUrl:null,sourceTitle:null,lastVerified:null,notes:"Custom Scale — Not Officially Verified"})}>Continue with Custom Scale</button></div></div>;
}

export default function UniversityGpaCalculator({ initialMode = "gpa", initialUniversity = null, standalonePath = null }) {
  const [policy,setPolicy]=useState(initialUniversity?getUniversityPolicy(initialUniversity):null);
  const [stage,setStage]=useState(policy?"calculator":"picker");
  const [tab,setTab]=useState(initialMode);
  const [inputMode,setInputMode]=useState("grade");
  const [campus,setCampus]=useState(""); const [program,setProgram]=useState("");
  const [courses,setCourses]=useState(()=>[emptyCourse(policy),emptyCourse(policy)]);
  const [semesters,setSemesters]=useState([emptySemester(),emptySemester()]);
  const [error,setError]=useState(""); const [result,setResult]=useState(null);

  function selectUniversity(id, c="", p="") { const next=getUniversityPolicy(id); setPolicy(next); setCampus(c); setProgram(p); setCourses([emptyCourse(next),emptyCourse(next)]); setSemesters([emptySemester(),emptySemester()]); setResult(null); setError(""); setStage("calculator"); }
  function saveCustom(next) { setPolicy(next); setCourses([emptyCourse(next),emptyCourse(next)]); setStage("calculator"); setResult(null); setError(""); }
  function resetCalculator() { setCourses([emptyCourse(policy),emptyCourse(policy)]); setSemesters([emptySemester(),emptySemester()]); setResult(null); setError(""); }
  const marksSupported = Boolean(policy?.grades?.some((g)=>g.minPercentage != null && g.maxPercentage != null));
  const verified = Boolean(policy?.sourceUrl && policy?.grades?.length);

  function calculate() { try { setError(""); setResult(tab==="gpa" ? calculateGpa(courses.map(c=>({...c,mode:inputMode})),policy) : calculateCgpaFromSemesters(semesters,policy)); } catch(e) { setResult(null); setError(e.message); } }

  const pageTitle = tab === "gpa" ? "GPA Calculator" : "CGPA Calculator";
  const description = "Calculate GPA and CGPA using university-specific grading policies for Pakistani universities.";
  const seoPath = standalonePath || `/tools/${tab}-calculator`;
  const seoSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: "GPA & CGPA Calculator for Pakistani Universities | MZ Smart Tool House",
        description: "Calculate GPA and CGPA using university-specific grading policies for Pakistani universities.",
        applicationCategory: "EducationalApplication",
        operatingSystem: "Any",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
          { "@type": "ListItem", position: 2, name: "GPA & CGPA Calculator", item: `${BASE_URL}/tools/gpa-calculator` },
          { "@type": "ListItem", position: 3, name: policy?.name || "University Selection", item: `${BASE_URL}${seoPath}` }
        ]
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Does this calculator use a generic GPA scale?",
            acceptedAnswer: { "@type": "Answer", text: "No. The selected university policy is loaded first; unverified universities are never silently assigned a generic scale." }
          },
          {
            "@type": "Question",
            name: "Can I verify the policy source?",
            acceptedAnswer: { "@type": "Answer", text: "Verified records show the official source and last verification date. Always compare with your current transcript and university regulations." }
          }
        ]
      }
    ]
  };

  if (stage === "picker") return <CalculatorShell tool={{id:`${tab}-calculator`,name:pageTitle,description,category:"calculators",icon:"calculator"}} howToUse={[]} faq={[]}><UniversityPicker onContinue={selectUniversity} onCustom={()=>setStage("custom")}/></CalculatorShell>;
  if (stage === "custom") return <CalculatorShell tool={{id:`${tab}-calculator`,name:pageTitle,description,category:"calculators",icon:"calculator"}} howToUse={[]} faq={[]}><CustomScale onSave={saveCustom}/></CalculatorShell>;

  return <CalculatorShell tool={{id:`${tab}-calculator`,name:pageTitle,description,category:"calculators",icon:"calculator"}} howToUse={["Select your university before entering courses.","Choose marks mode only when the selected official policy publishes percentage bands.","Enter course credit hours and grades, then calculate.","For CGPA, add each semester GPA with its total credit hours."]} faq={[{q:"Does this use a generic 4.0 scale?",a:"No. The selected institution's verified policy is loaded. Universities without a verified current policy are blocked from silently using a generic scale."},{q:"What about repeated courses?",a:policy?.repeatPolicy || "Check your university's current regulations before applying a repeat rule."}]}>
    <Seo path={seoPath} title="GPA & CGPA Calculator for Pakistani Universities" description="Calculate GPA and CGPA using university-specific grading policies for Pakistani universities. Select your university, enter courses and credit hours, and calculate your result according to the selected grading scale." schema={seoSchema} />
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><button type="button" className="mz-btn-ghost" onClick={()=>setStage("picker")}><ArrowLeft className="h-4 w-4"/> Change University</button><div className="text-sm text-navy-500">{campus && `Campus: ${campus}`} {program && ` · Program: ${program}`}</div></div>
      <PolicyPanel policy={policy}/>
      <div className="flex gap-2 rounded-2xl bg-navy-50 p-1 dark:bg-navy-900"><button type="button" onClick={()=>{setTab("gpa");setResult(null)}} className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold ${tab==="gpa"?"bg-white text-brand-700 shadow-sm dark:bg-navy-800 dark:text-brand-300":"text-navy-500"}`}>GPA Calculator</button><button type="button" onClick={()=>{setTab("cgpa");setResult(null)}} className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold ${tab==="cgpa"?"bg-white text-brand-700 shadow-sm dark:bg-navy-800 dark:text-brand-300":"text-navy-500"}`}>CGPA Calculator</button></div>
      {verified ? <>
        {tab==="gpa" ? <div className="mz-card p-5"><div className="mb-5 flex flex-wrap gap-2"><button type="button" className={`mz-btn-secondary ${inputMode==="marks"?"ring-2 ring-brand-300":""}`} disabled={!marksSupported} onClick={()=>{setInputMode("marks");setCourses(x=>x.map(c=>({...c,mode:"marks"})))}}>Calculate from Marks</button><button type="button" className={`mz-btn-secondary ${inputMode==="grade"?"ring-2 ring-brand-300":""}`} onClick={()=>{setInputMode("grade");setCourses(x=>x.map(c=>({...c,mode:"grade"})))}}>Calculate from Letter Grades</button>{!marksSupported && <span className="self-center text-xs text-amber-700">Marks-to-grade bands are not published by this policy; use letter-grade mode.</span>}</div><div className="space-y-3">{courses.map((row,i)=><div key={row.id} className="grid gap-2 sm:grid-cols-[1.2fr_1fr_120px_auto] sm:items-end"><input className="mz-input" placeholder={`Course ${i+1}`} value={row.name} onChange={e=>setCourses(x=>x.map(r=>r.id===row.id?{...r,name:e.target.value}:r))}/><input className="mz-input" placeholder="Credit Hours" type="number" min="0.5" step="0.5" value={row.creditHours} onChange={e=>setCourses(x=>x.map(r=>r.id===row.id?{...r,creditHours:e.target.value}:r))}/>{inputMode==="marks"?<input className="mz-input" placeholder="Marks %" type="number" min="0" max="100" step="0.01" value={row.marks} onChange={e=>setCourses(x=>x.map(r=>r.id===row.id?{...r,marks:e.target.value}:r))}/>:<select className="mz-input" value={row.grade} onChange={e=>setCourses(x=>x.map(r=>r.id===row.id?{...r,grade:e.target.value}:r))}>{policy.grades.map(g=><option key={g.letter} value={g.letter}>{g.letter} ({Number(g.gradePoint).toFixed(2)})</option>)}</select>}<button type="button" className="mz-btn-ghost" onClick={()=>setCourses(x=>x.filter(r=>r.id!==row.id))} disabled={courses.length<=1}><Trash2 className="h-4 w-4"/></button></div>)}</div><div className="mt-4 flex flex-wrap gap-3"><button type="button" className="mz-btn-secondary" onClick={()=>setCourses(x=>[...x,emptyCourse(policy,inputMode)])}><Plus className="h-4 w-4"/> Add Course</button><button type="button" className="mz-btn-primary" onClick={calculate}>Calculate GPA</button><button type="button" className="mz-btn-ghost" onClick={resetCalculator}><RotateCcw className="h-4 w-4"/> Reset</button></div></div> : <div className="mz-card p-5"><div className="space-y-3">{semesters.map((row,i)=><div key={row.id} className="grid gap-2 sm:grid-cols-[1.3fr_1fr_1fr_auto] sm:items-end"><input className="mz-input" placeholder={`Semester ${i+1}`} value={row.label} onChange={e=>setSemesters(x=>x.map(r=>r.id===row.id?{...r,label:e.target.value}:r))}/><input className="mz-input" type="number" min="0" max={policy.maxGPA} step="0.01" placeholder={`GPA (0-${policy.maxGPA})`} value={row.gpa} onChange={e=>setSemesters(x=>x.map(r=>r.id===row.id?{...r,gpa:e.target.value}:r))}/><input className="mz-input" type="number" min="0.5" step="0.5" placeholder="Credit Hours" value={row.creditHours} onChange={e=>setSemesters(x=>x.map(r=>r.id===row.id?{...r,creditHours:e.target.value}:r))}/><button type="button" className="mz-btn-ghost" onClick={()=>setSemesters(x=>x.filter(r=>r.id!==row.id))} disabled={semesters.length<=1}><Trash2 className="h-4 w-4"/></button></div>)}</div><div className="mt-4 flex flex-wrap gap-3"><button type="button" className="mz-btn-secondary" onClick={()=>setSemesters(x=>[...x,emptySemester()])}><Plus className="h-4 w-4"/> Add Semester</button><button type="button" className="mz-btn-primary" onClick={calculate}>Calculate CGPA</button><button type="button" className="mz-btn-ghost" onClick={resetCalculator}><RotateCcw className="h-4 w-4"/> Reset</button></div></div>}
        <ErrorBanner message={error}/>{result && <ResultCard title={tab==="gpa"?"Detailed GPA Result":"Detailed CGPA Result"}><ResultRow label={tab==="gpa"?"GPA":"CGPA"} value={(result.gpa??result.cgpa).toFixed(2)} highlight copyText={(result.gpa??result.cgpa).toFixed(2)}/><ResultRow label="Total Credit Hours" value={result.totalCredits}/><ResultRow label="Total Quality Points" value={result.totalQualityPoints.toFixed(2)}/></ResultCard>}
      </> : <div className="mz-card p-6"><h2 className="text-xl font-bold text-navy-900 dark:text-white">Policy verification required</h2><p className="mt-2 text-sm leading-6 text-navy-500 dark:text-navy-400">This institution is in the university directory, but a sufficiently reliable current official grading policy could not be verified. No generic GPA scale will be used.</p><button type="button" className="mz-btn-primary mt-5" onClick={()=>setStage("custom")}>Create Custom Grading Scale</button></div>}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100"><strong>Important:</strong> This calculator is for estimation. Always verify your result against your official transcript and current university regulations. Policy details can vary by campus, faculty, program, and admission batch.</div>
    </div>
  </CalculatorShell>;
}
