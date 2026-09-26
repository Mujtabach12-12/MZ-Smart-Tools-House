import { useMemo, useState } from "react";
import { Plus, Trash2, RotateCcw, Search, ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";
import CalculatorShell from "../../components/tools/CalculatorShell";
import ErrorBanner from "../../components/tools/ErrorBanner";
import ResultCard, { ResultRow } from "../../components/tools/ResultCard";
import { universityPolicies, getUniversityPolicy, isUniversityPolicyVerified } from "../../data/universities/policies";
import { calculateCgpaFromSemesters, calculateGpa, createCustomPolicy, isPolicyUsable } from "../../lib/calculators/universityGpa";
import Seo, { BASE_URL } from "../../components/layout/Seo";
import { trackEvent } from "../../lib/analytics";

const requested = universityPolicies;
const emptyCourse = (_policy, mode = "grade") => ({ id: crypto.randomUUID(), name: "", courseCode: "", creditHours: "", marks: "", grade: "", mode });
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
  const verified = isUniversityPolicyVerified(policy);
  const custom = policy?.isCustom === true;
  const canShowScale = verified || custom;

  return (
    <div className="mz-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300">
            {custom ? "Custom Grading Scale" : "University GPA Policy"}
          </p>
          <h2 className="mt-1 text-xl font-bold text-navy-900 dark:text-white">{policy?.name || "Grading policy"}</h2>
        </div>
        {verified ? (
          <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-500" aria-label="Verified policy" />
        ) : (
          <ShieldAlert className="h-6 w-6 shrink-0 text-amber-500" aria-label={custom ? "Custom user-defined scale" : "Policy not verified"} />
        )}
      </div>

      {custom && (
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-100">
          <strong>Custom scale — user-defined.</strong> MZ is using exactly the grade bands you entered. This is not presented as an official university policy.
        </div>
      )}

      {!verified && !custom && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
          <strong>Policy Not Verified.</strong> This repository contains policy/source metadata for this institution, but the official current policy could not be independently re-verified in this audit. MZ will not calculate an official-university GPA from it. Use a custom scale based on your current university regulations.
          {policy?.sourceUrl && (
            <p className="mt-2">
              <a className="font-semibold underline" href={policy.sourceUrl} target="_blank" rel="noreferrer">Open configured source for manual verification</a>
            </p>
          )}
        </div>
      )}

      {canShowScale && (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-navy-50 p-3 dark:bg-navy-900/60"><div className="text-xs text-navy-500">Grading Type</div><div className="mt-1 font-semibold text-navy-900 dark:text-white">{policy.gradingType}</div></div>
            <div className="rounded-xl bg-navy-50 p-3 dark:bg-navy-900/60"><div className="text-xs text-navy-500">GPA Scale</div><div className="mt-1 font-semibold text-navy-900 dark:text-white">{Number(policy.maxGPA).toFixed(2)}</div></div>
            <div className="rounded-xl bg-navy-50 p-3 dark:bg-navy-900/60"><div className="text-xs text-navy-500">Policy Status</div><div className="mt-1 font-semibold text-navy-900 dark:text-white">{verified ? "Verified" : "Custom / user-defined"}</div></div>
          </div>
          <div className="mt-5 overflow-x-auto rounded-xl border border-navy-100 dark:border-navy-800">
            <table className="min-w-full text-sm">
              <thead className="bg-navy-50 text-left dark:bg-navy-900"><tr><th className="px-4 py-3">Grade</th><th className="px-4 py-3">Marks</th><th className="px-4 py-3">Grade Point</th></tr></thead>
              <tbody>{policy.grades.map((g) => <tr key={g.letter} className="border-t border-navy-100 dark:border-navy-800"><td className="px-4 py-2.5 font-semibold text-navy-900 dark:text-white">{g.letter}</td><td className="px-4 py-2.5 text-navy-500">{g.minPercentage == null ? "—" : `${g.minPercentage}${g.maxPercentage != null && g.maxPercentage !== g.minPercentage ? `–${g.maxPercentage}` : "+"}%`}</td><td className="px-4 py-2.5 font-semibold text-brand-700 dark:text-brand-300">{Number(g.gradePoint).toFixed(2)}</td></tr>)}</tbody>
            </table>
          </div>
          {verified && (
            <div className="mt-4 space-y-2 text-sm text-navy-600 dark:text-navy-300">
              <p><strong>Repeat policy:</strong> {policy.repeatPolicy || "Check current university regulations."}</p>
              <p><strong>Grade replacement:</strong> {policy.gradeReplacementPolicy || "Check current university regulations."}</p>
              <p><strong>Policy Source:</strong> <a className="text-brand-600 hover:underline" href={policy.sourceUrl} target="_blank" rel="noreferrer">{policy.sourceTitle || "Official university policy"}</a></p>
              <p><strong>Last Verified:</strong> {policy.lastVerified}</p>
            </div>
          )}
        </>
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
      <div className="text-center"><div className="mx-auto inline-flex rounded-2xl bg-brand-50 p-3 text-brand-700 dark:bg-brand-950 dark:text-brand-300"><Search className="h-6 w-6"/></div><h1 className="mt-4 text-2xl font-bold text-navy-900 dark:text-white">Enter Your University / Institute Name</h1><p className="mt-2 text-sm text-navy-500 dark:text-navy-400">Choose your institution first. MZ will calculate only from an explicitly verified policy; otherwise use a custom scale based on your current regulations.</p></div>
      <label className="mt-7 block text-sm font-semibold text-navy-800 dark:text-navy-100">Search University
        <input autoFocus value={query} onChange={(e)=>setQuery(e.target.value)} className="mz-input mt-2" placeholder="Try UOL, COMSATS, FAST, PU, Lahore…"/>
      </label>
      <div className="mt-3 max-h-80 overflow-y-auto rounded-xl border border-navy-100 dark:border-navy-800">
        {results.map((u)=><button type="button" key={u.id} onClick={()=>setSelected(u.id)} className={`flex w-full items-center justify-between gap-3 border-b border-navy-100 px-4 py-3 text-left last:border-b-0 dark:border-navy-800 ${selected===u.id?"bg-brand-50 dark:bg-brand-950/40":"hover:bg-navy-50 dark:hover:bg-navy-900/60"}`}><span><span className="block font-semibold text-navy-900 dark:text-white">{u.name}</span><span className="text-xs text-navy-500">{u.shortName}{u.city?` · ${u.city}`:""}</span></span>{isUniversityPolicyVerified(u)?<span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">Verified</span>:<span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">Policy Not Verified</span>}</button>)}
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
  const [name, setName] = useState("");
  const [scale, setScale] = useState("4");
  const [error, setError] = useState("");
  const [grades, setGrades] = useState([
    { id: crypto.randomUUID(), letter: "A", min: "85", max: "100", point: "4" },
    { id: crypto.randomUUID(), letter: "B", min: "70", max: "84.99", point: "3" },
    { id: crypto.randomUUID(), letter: "C", min: "60", max: "69.99", point: "2" },
    { id: crypto.randomUUID(), letter: "D", min: "50", max: "59.99", point: "1" },
    { id: crypto.randomUUID(), letter: "F", min: "0", max: "49.99", point: "0" },
  ]);

  function save() {
    try {
      setError("");
      const policy = createCustomPolicy({
        name,
        maxGPA: scale,
        grades: grades.map((g) => ({ letter: g.letter, min: g.min, max: g.max, point: g.point })),
      });
      onSave(policy);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="mz-card p-6">
      <div>
        <span className="mz-badge">Custom Scale — User Defined</span>
        <h2 className="mt-2 text-xl font-bold text-navy-900 dark:text-white">Create Custom Grading Scale</h2>
        <p className="mt-2 text-sm text-navy-500 dark:text-navy-400">The values below are editable starting examples, not an official university policy. Replace them with the grading rules you have verified for your institution/program.</p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold text-navy-800 dark:text-navy-100">Scale name
          <input className="mz-input mt-2" placeholder="My university / program" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="text-sm font-semibold text-navy-800 dark:text-navy-100">Maximum GPA
          <input className="mz-input mt-2" type="number" inputMode="decimal" min="1" max="10" step="0.01" value={scale} onChange={(e) => setScale(e.target.value)} />
        </label>
      </div>
      <div className="mt-4 space-y-2">
        {grades.map((g, i) => (
          <div key={g.id} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]">
            <input aria-label={`Grade label ${i + 1}`} className="mz-input" placeholder="Grade" value={g.letter} onChange={(e) => setGrades((rows) => rows.map((r, j) => j === i ? { ...r, letter: e.target.value } : r))} />
            <input aria-label={`Minimum percentage ${i + 1}`} className="mz-input" type="number" inputMode="decimal" min="0" max="100" step="0.01" placeholder="Min %" value={g.min} onChange={(e) => setGrades((rows) => rows.map((r, j) => j === i ? { ...r, min: e.target.value } : r))} />
            <input aria-label={`Maximum percentage ${i + 1}`} className="mz-input" type="number" inputMode="decimal" min="0" max="100" step="0.01" placeholder="Max %" value={g.max} onChange={(e) => setGrades((rows) => rows.map((r, j) => j === i ? { ...r, max: e.target.value } : r))} />
            <input aria-label={`Grade point ${i + 1}`} className="mz-input" type="number" inputMode="decimal" min="0" step="0.01" placeholder="Point" value={g.point} onChange={(e) => setGrades((rows) => rows.map((r, j) => j === i ? { ...r, point: e.target.value } : r))} />
            <button className="mz-btn-ghost min-h-11" type="button" aria-label={`Remove grade ${i + 1}`} onClick={() => setGrades((rows) => rows.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
      <button type="button" className="mz-btn-secondary mt-3" onClick={() => setGrades((rows) => [...rows, { id: crypto.randomUUID(), letter: "", min: "", max: "", point: "" }])}><Plus className="h-4 w-4" /> Add Grade</button>
      {error && <ErrorBanner message={error} />}
      <div className="mt-5"><button type="button" className="mz-btn-primary" onClick={save}>Continue with Custom Scale</button></div>
    </div>
  );
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

  function selectUniversity(id, c="", p="") { const next=getUniversityPolicy(id); setPolicy(next); setCampus(c); setProgram(p); setCourses([emptyCourse(next),emptyCourse(next)]); setSemesters([emptySemester(),emptySemester()]); setResult(null); setError(""); setStage("calculator"); trackEvent("university_selected", { tool_id: `${tab}-calculator`, university_id: id, policy_verified: isUniversityPolicyVerified(next) }); }
  function saveCustom(next) { setPolicy(next); setCourses([emptyCourse(next),emptyCourse(next)]); setStage("calculator"); setResult(null); setError(""); trackEvent("university_custom_scale_created", { tool_id: `${tab}-calculator` }); }
  function resetCalculator() { setCourses([emptyCourse(policy),emptyCourse(policy)]); setSemesters([emptySemester(),emptySemester()]); setResult(null); setError(""); trackEvent("calculator_reset", { tool_id: `${tab}-calculator` }); }
  const verified = isUniversityPolicyVerified(policy);
  const usable = isPolicyUsable(policy);
  const marksSupported = Boolean(usable && policy?.grades?.some((g)=>g.minPercentage != null && g.maxPercentage != null));

  function calculate() { try { setError(""); const next = tab==="gpa" ? calculateGpa(courses.map(c=>({...c,mode:inputMode})),policy) : calculateCgpaFromSemesters(semesters,policy); setResult(next); trackEvent("calculator_complete", { tool_id: `${tab}-calculator`, policy_mode: policy?.isCustom ? "custom" : "verified_university" }); } catch(e) { setResult(null); setError(e.message); trackEvent("calculator_validation_error", { tool_id: `${tab}-calculator` }); } }

  const pageTitle = tab === "gpa" ? "GPA Calculator" : "CGPA Calculator";
  const description = "Calculate GPA and CGPA with an explicitly verified university policy when available, or a user-defined custom grading scale.";
  const seoPath = standalonePath || `/tools/${tab}-calculator`;
  const seoTitle = tab === "gpa" ? "GPA Calculator – Verified or Custom Scale" : "CGPA Calculator – Credit-Weighted Cumulative GPA";
  const seoDescription = tab === "gpa"
    ? "Calculate credit-weighted GPA using an explicitly verified university policy when available or a clearly labeled custom grading scale."
    : "Calculate credit-weighted CGPA from semester GPA and credit hours without silently applying an unverified university policy.";
  const seoSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: `${seoTitle} | MZ Smart Tool House`,
        description: seoDescription,
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
            acceptedAnswer: { "@type": "Answer", text: "No. Only explicitly verified policies are eligible for official-university calculation. Unverified universities are blocked from silent fallback, while custom scales remain clearly user-defined." }
          },
          {
            "@type": "Question",
            name: "Can I verify the policy source?",
            acceptedAnswer: { "@type": "Answer", text: "A policy is treated as verified only when it has been explicitly promoted after checking the official source. Configured source links alone are not treated as proof of verification." }
          }
        ]
      }
    ]
  };

  if (stage === "picker") return <CalculatorShell tool={{id:`${tab}-calculator`,name:pageTitle,description,category:"calculators",icon:"calculator"}} howToUse={[]} faq={[]}><UniversityPicker onContinue={selectUniversity} onCustom={()=>setStage("custom")}/></CalculatorShell>;
  if (stage === "custom") return <CalculatorShell tool={{id:`${tab}-calculator`,name:pageTitle,description,category:"calculators",icon:"calculator"}} howToUse={[]} faq={[]}><CustomScale onSave={saveCustom}/></CalculatorShell>;

  return <CalculatorShell tool={{id:`${tab}-calculator`,name:pageTitle,description,category:"calculators",icon:"calculator"}} howToUse={["Select your university before entering courses.","Choose marks mode only when the selected official policy publishes percentage bands.","Enter course credit hours and grades, then calculate.","For CGPA, add each semester GPA with its total credit hours."]} faq={[{q:"Does this use a generic 4.0 scale?",a:"No. Official-university mode is available only for explicitly verified policies. Otherwise the calculator requires a custom user-defined scale."},{q:"What about repeated courses?",a:policy?.repeatPolicy || "Check your university's current regulations before applying a repeat rule."}]}>
    <Seo path={seoPath} title={seoTitle} description={seoDescription} schema={seoSchema} />
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><button type="button" className="mz-btn-ghost" onClick={()=>setStage("picker")}><ArrowLeft className="h-4 w-4"/> Change University</button><div className="text-sm text-navy-500">{campus && `Campus: ${campus}`} {program && ` · Program: ${program}`}</div></div>
      <PolicyPanel policy={policy}/>
      <div className="flex gap-2 rounded-2xl bg-navy-50 p-1 dark:bg-navy-900"><button type="button" onClick={()=>{setTab("gpa");setResult(null)}} className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold ${tab==="gpa"?"bg-white text-brand-700 shadow-sm dark:bg-navy-800 dark:text-brand-300":"text-navy-500"}`}>GPA Calculator</button><button type="button" onClick={()=>{setTab("cgpa");setResult(null)}} className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold ${tab==="cgpa"?"bg-white text-brand-700 shadow-sm dark:bg-navy-800 dark:text-brand-300":"text-navy-500"}`}>CGPA Calculator</button></div>
      {usable ? <>
        {tab==="gpa" ? <div className="mz-card p-5"><div className="mb-5 flex flex-wrap gap-2"><button type="button" className={`mz-btn-secondary ${inputMode==="marks"?"ring-2 ring-brand-300":""}`} disabled={!marksSupported} onClick={()=>{setInputMode("marks");setCourses(x=>x.map(c=>({...c,mode:"marks"})))}}>Calculate from Marks</button><button type="button" className={`mz-btn-secondary ${inputMode==="grade"?"ring-2 ring-brand-300":""}`} onClick={()=>{setInputMode("grade");setCourses(x=>x.map(c=>({...c,mode:"grade"})))}}>Calculate from Letter Grades</button>{!marksSupported && <span className="self-center text-xs text-amber-700">Marks-to-grade bands are not published by this policy; use letter-grade mode.</span>}</div><div className="space-y-3">{courses.map((row,i)=><div key={row.id} className="grid gap-2 sm:grid-cols-[1.2fr_1fr_120px_auto] sm:items-end"><input className="mz-input" aria-label={`Course ${i+1} name`} placeholder={`Course ${i+1}`} value={row.name} onChange={e=>setCourses(x=>x.map(r=>r.id===row.id?{...r,name:e.target.value}:r))}/><input className="mz-input" aria-label={`Course ${i+1} credit hours`} placeholder="Credit Hours" type="number" inputMode="decimal" min="0.5" step="0.5" value={row.creditHours} onChange={e=>setCourses(x=>x.map(r=>r.id===row.id?{...r,creditHours:e.target.value}:r))}/>{inputMode==="marks"?<input className="mz-input" aria-label={`Course ${i+1} marks percentage`} placeholder="Marks %" type="number" inputMode="decimal" min="0" max="100" step="0.01" value={row.marks} onChange={e=>setCourses(x=>x.map(r=>r.id===row.id?{...r,marks:e.target.value}:r))}/>:<select aria-label={`Course ${i+1} letter grade`} className="mz-input" value={row.grade} onChange={e=>setCourses(x=>x.map(r=>r.id===row.id?{...r,grade:e.target.value}:r))}>{policy.grades.map(g=><option key={g.letter} value={g.letter}>{g.letter} ({Number(g.gradePoint).toFixed(2)})</option>)}</select>}<button type="button" className="mz-btn-ghost" onClick={()=>setCourses(x=>x.filter(r=>r.id!==row.id))} disabled={courses.length<=1}><Trash2 className="h-4 w-4"/></button></div>)}</div><div className="mt-4 flex flex-wrap gap-3"><button type="button" className="mz-btn-secondary" onClick={()=>setCourses(x=>[...x,emptyCourse(policy,inputMode)])}><Plus className="h-4 w-4"/> Add Course</button><button type="button" className="mz-btn-primary" onClick={calculate}>Calculate GPA</button><button type="button" className="mz-btn-ghost" onClick={resetCalculator}><RotateCcw className="h-4 w-4"/> Reset</button></div></div> : <div className="mz-card p-5"><div className="space-y-3">{semesters.map((row,i)=><div key={row.id} className="grid gap-2 sm:grid-cols-[1.3fr_1fr_1fr_auto] sm:items-end"><input className="mz-input" aria-label={`Semester ${i+1} label`} placeholder={`Semester ${i+1}`} value={row.label} onChange={e=>setSemesters(x=>x.map(r=>r.id===row.id?{...r,label:e.target.value}:r))}/><input className="mz-input" aria-label={`Semester ${i+1} GPA`} type="number" inputMode="decimal" min="0" max={policy.maxGPA} step="0.01" placeholder={`GPA (0-${policy.maxGPA})`} value={row.gpa} onChange={e=>setSemesters(x=>x.map(r=>r.id===row.id?{...r,gpa:e.target.value}:r))}/><input className="mz-input" aria-label={`Semester ${i+1} credit hours`} type="number" inputMode="decimal" min="0.5" step="0.5" placeholder="Credit Hours" value={row.creditHours} onChange={e=>setSemesters(x=>x.map(r=>r.id===row.id?{...r,creditHours:e.target.value}:r))}/><button type="button" className="mz-btn-ghost" onClick={()=>setSemesters(x=>x.filter(r=>r.id!==row.id))} disabled={semesters.length<=1}><Trash2 className="h-4 w-4"/></button></div>)}</div><div className="mt-4 flex flex-wrap gap-3"><button type="button" className="mz-btn-secondary" onClick={()=>setSemesters(x=>[...x,emptySemester()])}><Plus className="h-4 w-4"/> Add Semester</button><button type="button" className="mz-btn-primary" onClick={calculate}>Calculate CGPA</button><button type="button" className="mz-btn-ghost" onClick={resetCalculator}><RotateCcw className="h-4 w-4"/> Reset</button></div></div>}
        <ErrorBanner message={error}/>{result && <ResultCard title={tab==="gpa"?"Detailed GPA Result":"Detailed CGPA Result"}><ResultRow label={tab==="gpa"?"GPA":"CGPA"} value={(result.gpa??result.cgpa).toFixed(2)} highlight copyText={(result.gpa??result.cgpa).toFixed(2)}/><ResultRow label="Total Credit Hours" value={result.totalCredits}/><ResultRow label="Total Quality Points" value={result.totalQualityPoints.toFixed(2)}/></ResultCard>}
      </> : <div className="mz-card p-6"><h2 className="text-xl font-bold text-navy-900 dark:text-white">Policy verification required</h2><p className="mt-2 text-sm leading-6 text-navy-500 dark:text-navy-400">This institution is in the university directory, but its current official grading policy is not explicitly verified in this release. No generic or source-only policy will be used for calculation.</p><button type="button" className="mz-btn-primary mt-5" onClick={()=>setStage("custom")}>Create Custom Grading Scale</button></div>}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100"><strong>Important:</strong> This calculator is for estimation. Always verify your result against your official transcript and current university regulations. Policy details can vary by campus, faculty, program, and admission batch.</div>
    </div>
  </CalculatorShell>;
}
