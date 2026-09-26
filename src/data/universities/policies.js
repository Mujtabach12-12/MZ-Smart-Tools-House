const verifiedDate = "2026-09-16";

const bands = (rows) => rows.map(([letter, minPercentage, maxPercentage, gradePoint]) => ({
  letter, minPercentage, maxPercentage, gradePoint,
}));

export const universityPolicies = [
  {
    id: "uol", name: "University of Lahore", shortName: "UOL", country: "Pakistan", city: "Lahore", scale: 4,
    gradingType: "absolute", maxGPA: 4, minimumPassingGrade: "D", minimumPassingPoint: 1,
    grades: bands([["A",85,100,4], ["A-",80,84,3.75], ["B+",75,79,3.5], ["B",70,74,3], ["C+",65,69,2.5], ["C",60,64,2], ["D+",55,59,1.5], ["D",50,54,1], ["F",0,49,0]]),
    specialGrades: [{letter:"I",label:"Incomplete",countsInGpa:false},{letter:"W",label:"Withdrawal",countsInGpa:false}],
    repeatPolicy: "For undergraduate students, the 2024 handbook says a repeated course below C may be repeated and the better grade is used in CGPA calculation.",
    repeatRule: "better",
    gradeReplacementPolicy: "Verify against the student's program/batch regulations before applying a repeat/improvement rule.",
    sourceUrl: "https://uol.edu.pk/wp-content/uploads/2025/06/Student-Handbook-2024_compressed.pdf", sourceTitle: "UOL Student Handbook 2024 — Semester Rules & Regulations", lastVerified: verifiedDate,
    notes: "Absolute grading. The published policy states the percentage bands and 4-point conversion shown here.",
  },
  {
    id: "ucp", name: "University of Central Punjab", shortName: "UCP", country: "Pakistan", city: "Lahore", scale: 4,
    gradingType: "relative", maxGPA: 4, minimumPassingGrade: "D", minimumPassingPoint: 1,
    grades: bands([["A",86,100,4], ["A-",82,85,3.67], ["B+",78,81,3.33], ["B",74,77,3], ["B-",70,73,2.67], ["C+",66,69,2.33], ["C",62,65,2], ["C-",58,61,1.67], ["D+",54,57,1.33], ["D",50,53,1], ["F",0,49,0]]),
    specialGrades: [{letter:"W",label:"Withdrawal",countsInGpa:false},{letter:"I",label:"Incomplete",countsInGpa:false},{letter:"N",label:"Continued",countsInGpa:false},{letter:"S",label:"Satisfactory",countsInGpa:false},{letter:"US",label:"Unsatisfactory",countsInGpa:false},{letter:"P/F",label:"Pass/Fail",countsInGpa:false}],
    repeatPolicy: "UCP rules include repeat/retake provisions; apply the current program rules to repeated courses.",
    repeatRule: "better",
    gradeReplacementPolicy: "Grades without defined grade points do not contribute to GPA/CGPA.",
    sourceUrl: "https://ucp.edu.pk/rules-regulations/", sourceTitle: "UCP Rules & Regulations — Grades and Grading System", lastVerified: verifiedDate,
    notes: "UCP states it generally follows relative grading while publishing a 4-point numerical equivalence table.",
  },
  {
    id: "fast", name: "FAST-NUCES", shortName: "FAST", country: "Pakistan", scale: 4, gradingType: "letter-points",
    maxGPA: 4, minimumPassingGrade: "D", minimumPassingPoint: 1,
    grades: [["A+",4],["A",4],["A-",3.67],["B+",3.33],["B",3],["B-",2.67],["C+",2.33],["C",2],["D",1],["F",0]].map(([letter,gradePoint])=>({letter,gradePoint,minPercentage:null,maxPercentage:null})),
    specialGrades: [{letter:"FA",label:"Fail due to attendance shortage",gradePoint:0,countsInGpa:true},{letter:"I",label:"Incomplete",countsInGpa:false},{letter:"W",label:"Withdrawn",countsInGpa:false},{letter:"S",label:"Satisfactory",countsInGpa:false},{letter:"U",label:"Unsatisfactory",countsInGpa:false},{letter:"CN",label:"Continue",countsInGpa:false}],
    repeatPolicy: "FAST states that for repeat courses only the most recent grade points are used in CGPA, even if lower than the earlier attempt.",
    repeatRule: "most-recent",
    gradeReplacementPolicy: "Most recent grade replaces the earlier attempt for CGPA calculation.",
    sourceUrl: "https://www.nu.edu.pk/Student/Grading", sourceTitle: "FAST-NUCES Student Grading", lastVerified: verifiedDate,
    notes: "FAST publishes separate program-level grade lists; this record uses the BBA/BS table on its official grading page.",
  },
  {
    id: "nust", name: "National University of Sciences & Technology", shortName: "NUST", country: "Pakistan", scale: 4, gradingType: "absolute",
    maxGPA: 4, minimumPassingGrade: "D", minimumPassingPoint: 1,
    grades: bands([["A",80,100,4], ["B+",70,79,3.5], ["B",60,69,3], ["C+",55,59,2.5], ["C",50,54,2], ["D+",45,49,1.5], ["D",40,44,1], ["F",0,39,0]]),
    specialGrades: [{letter:"I",label:"Incomplete",countsInGpa:false},{letter:"W",label:"Dropped",countsInGpa:false},{letter:"Q",label:"Qualified",countsInGpa:false},{letter:"T",label:"Transfer",countsInGpa:false},{letter:"XF",label:"F due to attendance shortage",gradePoint:0,countsInGpa:true}],
    repeatPolicy: "NUST program/handbook rules should be checked for repeat/improvement cases.", gradeReplacementPolicy: "Verify against the student's faculty/program regulations.",
    sourceUrl: "https://nust.edu.pk/wp-content/uploads/2020/03/Revised-Undergraduate-Handbook.pdf", sourceTitle: "NUST Undergraduate Handbook — Academic Standards", lastVerified: verifiedDate,
    notes: "The handbook distinguishes Major Field Courses and other courses; major-field passing grade is C+ while other courses can pass at D.",
  },
  {
    id: "giki", name: "Ghulam Ishaq Khan Institute of Engineering Sciences and Technology", shortName: "GIKI", country: "Pakistan", scale: 4, gradingType: "letter-points",
    maxGPA: 4, minimumPassingGrade: "D", minimumPassingPoint: 1,
    grades: [["A",4],["A-",3.67],["B+",3.33],["B",3],["B-",2.67],["C+",2.33],["C",2],["C-",1.67],["D+",1.33],["D",1],["F",0]].map(([letter,gradePoint])=>({letter,gradePoint,minPercentage:null,maxPercentage:null})),
    specialGrades: [{letter:"I",label:"Incomplete",countsInGpa:false},{letter:"W",label:"Withdrawn",countsInGpa:false}],
    repeatPolicy: "An F requires repeat; academic rules govern the exact improvement treatment.", gradeReplacementPolicy: "Verify the current academic regulations for improvement/repeat treatment.",
    sourceUrl: "https://giki.edu.pk/academics/academic-setup/", sourceTitle: "GIKI Academic Setup — Grading System", lastVerified: verifiedDate,
    notes: "Official page confirms the letter-to-point scale and that I/W are excluded from GPA.",
  },
  {
    id: "bahria", name: "Bahria University", shortName: "BU", country: "Pakistan", scale: 4, gradingType: "absolute",
    maxGPA: 4, minimumPassingGrade: "D", minimumPassingPoint: 1.5,
    grades: bands([["A",87,100,4], ["B+",80,86,3.5], ["B",72,79,3], ["C+",66,71,2.5], ["C",60,65,2], ["D",50,59,1.5], ["F",0,49,0]]),
    specialGrades: [{letter:"W",label:"Withdrawal",countsInGpa:false},{letter:"I",label:"Incomplete",countsInGpa:false}],
    repeatPolicy: "Only the highest of all attempts is used in CGPA; the course can only be repeated within one year of result declaration.", gradeReplacementPolicy: "Highest attempt counts in CGPA.",
    sourceUrl: "https://archive.bahria.edu.pk/index.php/academic-rules/", sourceTitle: "Bahria University Academic Rules", lastVerified: verifiedDate,
    notes: "The archived official university rules page publishes the grading table and repeat rule.",
  },
  {
    id: "air", name: "Air University", shortName: "AU", country: "Pakistan", scale: 4, gradingType: "letter-points",
    maxGPA: 4, minimumPassingGrade: "D", minimumPassingPoint: 1,
    grades: [["A",4],["A-",3.67],["B+",3.33],["B",3],["B-",2.67],["C+",2.33],["C",2],["C-",1.67],["D",1],["F",0]].map(([letter,gradePoint])=>({letter,gradePoint,minPercentage:null,maxPercentage:null})),
    specialGrades: [{letter:"I",label:"Incomplete",countsInGpa:false},{letter:"W",label:"Withdrawal",countsInGpa:false}],
    repeatPolicy: "Program-specific academic regulations govern repeat/retest treatment.", gradeReplacementPolicy: "Verify the applicable Air University program regulations.",
    sourceUrl: "https://webdata.au.edu.pk/Pages/Academics/assets/forms/AU_Regulation_2025_21_November.pdf", sourceTitle: "Air University Regulations 2025", lastVerified: verifiedDate,
    notes: "Official 2025 regulations publish the undergraduate letter/grade-point table; some programs may use additional rules.",
  },
  {
    id: "iba", name: "IBA Karachi", shortName: "IBA", country: "Pakistan", scale: 4, gradingType: "absolute-or-relative",
    maxGPA: 4, minimumPassingGrade: "C", minimumPassingPoint: 2,
    grades: bands([["A",93,100,4], ["A-",87,92,3.67], ["B+",82,86,3.33], ["B",77,81,3], ["B-",72,76,2.67], ["C+",68,71,2.33], ["C",64,67,2], ["C-",60,63,1.67], ["F",0,59,0]]),
    specialGrades: [{letter:"I",label:"Incomplete",countsInGpa:false},{letter:"W",label:"Course Withdrawn",countsInGpa:false}],
    repeatPolicy: "For improvement repeats, the better grade is considered toward CGPA; there is no averaging of old and new grades.", gradeReplacementPolicy: "Better repeated grade is used toward CGPA, subject to IBA's formal improvement process.",
    sourceUrl: "https://examination.iba.edu.pk/General.php", sourceTitle: "IBA Examination Department — Grading and Evaluation", lastVerified: verifiedDate,
    notes: "IBA states faculty may use absolute or relative grading; the published absolute plan is used for marks-mode estimation.",
  },
  {
    id: "fcc", name: "Forman Christian College", shortName: "FCCU", country: "Pakistan", scale: 4, gradingType: "absolute",
    maxGPA: 4, minimumPassingGrade: "D", minimumPassingPoint: 1,
    grades: bands([["A",93,100,4], ["A-",90,92,3.7], ["B+",87,89,3.3], ["B",83,86,3], ["B-",80,82,2.7], ["C+",77,79,2.3], ["C",73,76,2], ["C-",70,72,1.7], ["D+",67,69,1.3], ["D",60,66,1], ["F",0,59,0]]),
    specialGrades: [{letter:"NS",label:"Did not show up",gradePoint:0,countsInGpa:true},{letter:"W",label:"Official withdrawal",countsInGpa:false},{letter:"AW",label:"Administrative withdrawal",countsInGpa:false},{letter:"AU",label:"Audit/listener",countsInGpa:false},{letter:"I",label:"Incomplete",countsInGpa:false},{letter:"T",label:"Transferred credit",countsInGpa:false}],
    repeatPolicy: "Current program catalog should be checked for course repeat/improvement treatment.", gradeReplacementPolicy: "Verify the applicable catalog/academic policy.",
    sourceUrl: "https://www.fccollege.edu.pk/wp-content/uploads/Bacc-Catalog-2019-Latest.pdf", sourceTitle: "FCC Baccalaureate Degree Catalog — Grading Policies", lastVerified: verifiedDate,
    notes: "The available official catalog source is older; treat this as an estimation reference and verify the current program handbook.",
  },
  {
    id: "itu", name: "Information Technology University", shortName: "ITU", country: "Pakistan", city: "Lahore", scale: 4, gradingType: "letter-points",
    maxGPA: 4, minimumPassingGrade: "D", minimumPassingPoint: 1,
    grades: [["A+",4],["A",4],["A-",3.67],["B+",3.33],["B",3],["B-",2.67],["C+",2.33],["C",2],["C-",1.67],["D+",1.33],["D",1],["F",0]].map(([letter,gradePoint])=>({letter,gradePoint,minPercentage:null,maxPercentage:null})),
    specialGrades: [{letter:"I",label:"Incomplete",countsInGpa:false},{letter:"W",label:"Withdrawn",countsInGpa:false},{letter:"S/U",label:"Satisfactory/Unsatisfactory",countsInGpa:false},{letter:"CR",label:"Continuing Research",countsInGpa:false}],
    repeatPolicy: "ITU states repeated courses use only the most recent grade points for CGPA, even if lower.", gradeReplacementPolicy: "Most recent repeat grade points are used.",
    sourceUrl: "https://itu.edu.pk/academics/grading-policy/", sourceTitle: "ITU Academic Grading Policy", lastVerified: verifiedDate,
    notes: "The official page provides grade points and explicit repeat-course treatment.",
  },
  {
    id: "lgu", name: "Lahore Garrison University", shortName: "LGU", country: "Pakistan", city: "Lahore", scale: 4, gradingType: "absolute-or-relative",
    maxGPA: 4, minimumPassingGrade: "D", minimumPassingPoint: 1,
    grades: bands([["A",85,100,4], ["A-",79,84,3.7], ["B+",74,78,3.3], ["B",70,73,3], ["B-",66,69,2.7], ["C+",62,65,2.3], ["C",58,61,2], ["C-",54,57,1.7], ["D",50,53,1], ["F",0,49,0]]),
    specialGrades: [{letter:"SF",label:"Failure due to short attendance",gradePoint:0,countsInGpa:true},{letter:"I",label:"Incomplete",countsInGpa:false},{letter:"W",label:"Withdrawal",countsInGpa:false}],
    repeatPolicy: "LGU publishes a grade-improvement policy; exact repeat handling should be checked against the current handbook and program.", gradeReplacementPolicy: "Use the current LGU grade-improvement policy for repeats.",
    sourceUrl: "https://lgu.edu.pk/wp-content/uploads/2025/09/Student-Handbook-Volume-2.pdf", sourceTitle: "LGU Student Handbook Volume 2 — Academic Policies", lastVerified: verifiedDate,
    notes: "LGU states absolute grading is used for classes under 20 and relative grading for larger classes; marks-mode is therefore an estimation only when relative grading applies.",
  },
  {
    id: "ned", name: "NED University of Engineering & Technology", shortName: "NEDUET", country: "Pakistan", city: "Karachi", scale: 4, gradingType: "absolute",
    maxGPA: 4, minimumPassingGrade: "D", minimumPassingPoint: 1,
    grades: bands([["A+",94,100,4], ["A",85,93,4], ["A-",80,84,3.7], ["B+",75,79,3.4], ["B",70,74,3], ["B-",67,69,2.7], ["C+",64,66,2.4], ["C",60,63,2], ["C-",57,59,1.7], ["D+",54,56,1.4], ["D",50,53,1], ["F",0,49,0]]),
    specialGrades: [{letter:"P",label:"Pass in non-credit course",countsInGpa:false},{letter:"IP",label:"In Progress",countsInGpa:false},{letter:"X",label:"Exempted",countsInGpa:false},{letter:"I",label:"Incomplete",countsInGpa:false},{letter:"W",label:"Withdrawal",countsInGpa:false},{letter:"WU",label:"Unofficial withdrawal",countsInGpa:false}],
    repeatPolicy: "NED course-repeat/improvement rules should be checked in the applicable academic regulations.", gradeReplacementPolicy: "Verify current program rules.",
    sourceUrl: "https://tiest.neduet.edu.pk/node/151", sourceTitle: "NEDUET General Guidelines — Grade Points", lastVerified: verifiedDate,
    notes: "Official page provides percentage bands, grade points and GPA/CGPA formula.",
  },
  {
    id: "pu", name: "University of the Punjab", shortName: "PU", country: "Pakistan", city: "Lahore", scale: 4, gradingType: "absolute",
    maxGPA: 4, minimumPassingGrade: "D", minimumPassingPoint: 1,
    grades: bands([["A",85,100,4], ["A-",80,84,3.7], ["B+",75,79,3.3], ["B",70,74,3], ["B-",65,69,2.7], ["C+",61,64,2.3], ["C",58,60,2], ["C-",55,57,1.7], ["D",50,54,1], ["F",0,49,0]]),
    specialGrades: [], repeatPolicy: "PU's cited undergraduate semester rules require re-registration for F and D courses for improvement; exact current program rules should be checked.", gradeReplacementPolicy: "Re-register F/D courses for improvement under the cited rules.",
    sourceUrl: "https://www.pu.edu.pk/puac/download/Flax-Affiliated-Colleges.pdf", sourceTitle: "University of the Punjab — Semester Rules & Regulations for Undergraduate Studies", lastVerified: verifiedDate,
    notes: "This source is specifically for affiliated colleges; other PU programs may have different rules. Select the correct program/campus before relying on marks-mode.",
  },
  {
    id: "numl", name: "National University of Modern Languages", shortName: "NUML", country: "Pakistan", city: "Islamabad", scale: 4, gradingType: "absolute",
    maxGPA: 4, minimumPassingGrade: "D", minimumPassingPoint: 1,
    grades: bands([["A+",90,100,4], ["A",80,89.99,4], ["B+",75,79.99,3.5], ["B",70,74.99,3], ["C+",65,69.99,2.5], ["C",60,64.99,2], ["D+",55,59.99,1.5], ["D",50,54.99,1], ["F",0,49.99,0]]),
    specialGrades: [], repeatPolicy: "Verify current NUML academic regulations for repeat/improvement treatment.", gradeReplacementPolicy: "Verify current program/batch rules.",
    sourceUrl: "https://www.numl.edu.pk/gallery/1737095171Student%20guide%20and%20handbook.pdf", sourceTitle: "NUML Student Guide and Handbook", lastVerified: verifiedDate,
    notes: "Official handbook gives grade bands and states SGPA/CGPA are credit-weighted.",
  },
  {
    id: "iub", name: "Islamia University Bahawalpur", shortName: "IUB", country: "Pakistan", city: "Bahawalpur", verified:false, policyStatus:"verification-required", scale:null, gradingType:null,
    maxGPA: null, minimumPassingGrade: null, minimumPassingPoint: null, grades: [], specialGrades: [], repeatPolicy: null, gradeReplacementPolicy: null, sourceUrl: null, sourceTitle: null, lastVerified: null,
    notes: "A program-specific IUB regulation was found, but a current program-wide policy could not be safely established for this calculator release. Use Custom Scale or the current program/batch regulations."
  },
  {
    id: "uob", name: "University of Balochistan", shortName: "UOB", country: "Pakistan", city: "Quetta", scale: 4, gradingType: "marks-derived-fractional",
    maxGPA: 4, minimumPassingGrade: "D", minimumPassingPoint: 1,
    grades: bands([["A+",85,100,4], ["A",80,84,3.4], ["B+",75,79,3.1], ["B",65,74,2.4], ["C+",61,64,2.1], ["C",58,60,1.8], ["D",50,57,1], ["F",0,49,0]]),
    gradePointRule: "UOB's Graduate Studies Office publishes a point for each whole percentage; exact marks should be used for fractional points.",
    specialGrades: [{letter:"W",label:"Withdrawn",countsInGpa:false},{letter:"I",label:"Incomplete",countsInGpa:false}], repeatPolicy: "Verify current program regulations.", gradeReplacementPolicy: "Verify current program regulations.",
    sourceUrl: "https://application.uob.edu.pk/gso/COURSE-WORK-EVALUATION%20new.html", sourceTitle: "University of Balochistan Graduate Studies Office — Course Work Evaluation", lastVerified: verifiedDate,
    notes: "Official source is the Graduate Studies Office; undergraduate/faculty-specific rules may differ.",
  },
  {
    id: "riphah", name: "Riphah International University", shortName: "RIU", country: "Pakistan", scale: 4, gradingType: "marks-derived-fractional",
    maxGPA: 4, minimumPassingGrade: "D", minimumPassingPoint: 1,
    grades: bands([["A+",90,100,4], ["A",80,89,4], ["A-",78,79,3.8], ["B+",74,77,3.4], ["B",70,73,3], ["B-",68,69,2.8], ["C+",64,67,2.4], ["C",60,63,2], ["C-",58,59,1.8], ["D+",54,57,1.4], ["D",50,53,1], ["F",0,49,0]]),
    gradePointRule: "Riphah states the grade point increases by 0.1 for each score above the minimum of the letter-grade band; exact marks are therefore required for the exact point.",
    specialGrades: [{letter:"I",label:"Incomplete",countsInGpa:false},{letter:"W",label:"Withdrawal",countsInGpa:false},{letter:"R",label:"Replaced Grade",countsInGpa:false}], repeatPolicy: "A replaced grade is represented separately; apply the current program regulations for repeat/improvement cases.", gradeReplacementPolicy: "Use the university's replacement/improvement rules; do not average attempts automatically.",
    sourceUrl: "https://helpdesk.riphah.edu.pk/public/assets/download_images/DownloadAttachments-69661f00e614c.pdf", sourceTitle: "Riphah Academic Regulations — 5th Revision 2024", lastVerified: verifiedDate,
    notes: "Official 2024 academic regulations publish a fractional grade-point rule. Exact program rules should be checked.",
  },
  {
    id: "superior", name: "Superior University", shortName: "SU", country: "Pakistan", city: "Lahore", scale: 4, gradingType: "absolute",
    maxGPA: 4, minimumPassingGrade: "D", minimumPassingPoint: 1,
    grades: bands([["A",86,100,4], ["A-",82,85,3.67], ["B+",78,81,3.33], ["B",74,77,3], ["B-",70,73,2.67], ["C+",66,69,2.33], ["C",62,65,2], ["C-",58,61,1.67], ["D+",54,57,1.33], ["D",50,53,1], ["F",0,49,0]]),
    specialGrades: [{letter:"I",label:"Incomplete",countsInGpa:false},{letter:"W",label:"Withdrawal",countsInGpa:false},{letter:"R",label:"Replaced Grade",countsInGpa:false},{letter:"Imp",label:"Improvement",countsInGpa:false}],
    repeatPolicy: "The published undergraduate regulations exclude W and I from SGPA and W/I/R from CGPA quality-point calculation.", gradeReplacementPolicy: "R/improvement is handled separately; do not average automatically.",
    sourceUrl: "https://my.superior.edu.pk/uploads/help/superior%20academic%20regulations%20%28undergraduate%20program%29.pdf", sourceTitle: "Superior University Academic Regulations — Undergraduate Program", lastVerified: verifiedDate,
    notes: "The cited official regulations provide a complete undergraduate table and rounding rule.",
  },
];

const requestedUniversities = [
  ["comsats","COMSATS University Islamabad","CUI","Islamabad"], ["gcu-lahore","Government College University Lahore","GCU","Lahore"], ["lums","LUMS","LUMS","Lahore"], ["uet-lahore","University of Engineering and Technology Lahore","UET Lahore","Lahore"],
  ["uog","University of Gujrat","UOG","Gujrat"], ["uskt","University of Sialkot","USKT","Sialkot"], ["umt","University of Management and Technology","UMT","Lahore"],
  ["ue","University of Education","UE","Lahore"], ["bzu","Bahauddin Zakariya University","BZU","Multan"], ["uop","University of Peshawar","UOP","Peshawar"],
];

for (const [id,name,shortName,city] of requestedUniversities) {
  universityPolicies.push({ id, name, shortName, country:"Pakistan", city, verified:false, policyStatus:"verification-required", scale:null, gradingType:null, maxGPA:null, grades:[], specialGrades:[], sourceUrl:null, sourceTitle:null, lastVerified:null, notes:"No sufficiently authoritative current grading table was verified from the official university source during this release. The calculator will not guess a scale; use Custom Scale or provide the current program/batch regulations." });
}

// Remaining requested entries that were not safely verified in this release.
for (const [id,name,shortName,city] of [
  ["gcu-lahore","Government College University Lahore","GCU","Lahore"], ["bahria","Bahria University","BU","Islamabad"], ["air","Air University","AU","Islamabad"],
]) {
  // already present in verifiedPolicies; this list documents intentional coverage.
}


const uob = universityPolicies.find((p) => p.id === "uob");
if (uob) {
  const points = {50:1,51:1.1,52:1.2,53:1.3,54:1.4,55:1.5,56:1.6,57:1.7,58:1.8,59:1.9,60:2,61:2.1,62:2.2,63:2.3,64:2.3,65:2.4,66:2.5,67:2.5,68:2.6,69:2.7,70:2.8,71:2.8,72:2.9,73:2.9,74:3,75:3.1,76:3.1,77:3.2,78:3.2,79:3.3,80:3.4,81:3.5,82:3.6,83:3.75,84:3.9};
  uob.pointForMark = (mark) => { const m = Math.round(mark); if (m >= 85) return {letter:"A+",gradePoint:4}; if (m >= 80) return {letter:"A",gradePoint:points[m] ?? 3.4}; if (m >= 75) return {letter:"B+",gradePoint:points[m] ?? 3.1}; if (m >= 65) return {letter:"B",gradePoint:points[m] ?? 2.4}; if (m >= 61) return {letter:"C+",gradePoint:points[m] ?? 2.1}; if (m >= 58) return {letter:"C",gradePoint:points[m] ?? 1.8}; if (m >= 50) return {letter:"D",gradePoint:Math.max(1,m-49)}; return {letter:"F",gradePoint:0}; };
}

const riphah = universityPolicies.find((p) => p.id === "riphah");
if (riphah) {
  riphah.pointForMark = (mark) => {
    const m = Math.round(mark);
    const ranges = [[90,"A+",4],[80,"A",4],[78,"A-",3.8],[74,"B+",3.4],[70,"B",3],[68,"B-",2.8],[64,"C+",2.4],[60,"C",2],[58,"C-",1.8],[54,"D+",1.4],[50,"D",1]];
    const hit = ranges.find(([min]) => m >= min);
    if (!hit) return {letter:"F",gradePoint:0};
    const [min,letter,base] = hit;
    return {letter,gradePoint:Math.min(4, Number((base + (m-min)*0.1).toFixed(1)))};
  };
}

// A source URL or an old verification date is not, by itself, proof that a
// policy is current and verified. Only records explicitly promoted with
// `verified: true` after checking the official policy may be used as an
// official university calculation mode. This prevents silent trust of stale
// or previously imported policy data.
for (const policy of universityPolicies) {
  if (policy.verified !== true) {
    policy.verified = false;
    policy.policyStatus ||= policy.sourceUrl ? "source-configured-unverified" : "verification-required";
  }
}

export const isUniversityPolicyVerified = (policy) => Boolean(
  policy?.verified === true &&
  policy?.sourceUrl &&
  policy?.lastVerified &&
  policy?.grades?.length &&
  Number.isFinite(Number(policy?.maxGPA))
);

export const getUniversityPolicy = (id) => universityPolicies.find((p) => p.id === id);
export const verifiedUniversities = universityPolicies.filter(isUniversityPolicyVerified);
export const allUniversities = universityPolicies.map((policy) => ({
  id: policy.id,
  name: policy.name,
  shortName: policy.shortName,
  city: policy.city,
  verified: isUniversityPolicyVerified(policy),
  source: policy.sourceUrl,
  policyStatus: policy.policyStatus,
}));
