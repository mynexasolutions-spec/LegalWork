import { formatDate } from "./cases";

// Everything below is illustrative demo output - there is no AI backend behind it.

const criminalCases = [
  ["State of U.P. vs. Mohan Singh", "2024 SCC Online All 2456", "Supreme Court", "Criminal Appeal", 92, "In this case, the court held that mere possession of stolen property is not sufficient unless intent is proven beyond doubt. The benefit of doubt is to be accorded..."],
  ["Rajesh vs. State", "2023 (5) RCR (Criminal) 321", "High Court (Delhi)", "Criminal Appeal", 78, "Similar facts regarding mobile phone theft. Court relied on CCTV evidence and upheld conviction under Section 379 IPC..."],
  ["State vs. Amit Kumar", "2022 SCC Online All 1123", "Allahabad High Court", "Criminal Appeal", 72, "Benefit of doubt given due to lack of direct evidence. Highlights importance of proper investigation and chain of custody..."],
  ["Ramesh Kumar vs. State", "2021 (3) RCR (Criminal) 215", "Supreme Court", "Criminal Appeal", 65, "Court discussed admissibility of electronic evidence and CCTV footage under Indian Evidence Act..."],
  ["State of Maharashtra vs. Suresh Patil", "2020 SCC Online Bom 456", "Bombay High Court", "Criminal Appeal", 61, "Discussed the scope of Section 379 IPC and requirement of mens rea for conviction..."],
  ["State vs. Ravi Shankar", "2019 SCC Online Pat 812", "Patna High Court", "Criminal Appeal", 58, "Court examined recovery of stolen articles and the presumption available under Section 114(a) of the Evidence Act..."],
  ["Sunil Kumar vs. State of Haryana", "2018 (2) RCR (Criminal) 204", "Punjab & Haryana High Court", "Criminal Appeal", 56, "Delay in lodging the FIR was held not fatal where the prosecution offered a plausible explanation..."],
  ["State vs. Imtiyaz Ali", "2021 SCC Online Del 3310", "Delhi High Court", "Criminal Revision", 54, "Identification of the accused through CCTV footage requires a certificate under Section 65B..."],
  ["Dinesh vs. State of Rajasthan", "2017 SCC Online Raj 1892", "Rajasthan High Court", "Criminal Appeal", 52, "Conviction set aside as the seizure memo was not supported by independent witnesses..."],
  ["State of M.P. vs. Gopal", "2016 SCC Online MP 2210", "Madhya Pradesh High Court", "Criminal Appeal", 49, "Stolen property recovered at the instance of the accused; discussion of Section 27 of the Evidence Act..."],
  ["Anil Kumar vs. State of Karnataka", "2020 SCC Online Kar 1450", "Karnataka High Court", "Criminal Petition", 47, "Quashing refused where the chargesheet disclosed a prima facie case of dishonest taking..."],
  ["Rahim vs. State of Kerala", "2015 SCC Online Ker 3920", "Kerala High Court", "Criminal Appeal", 44, "Sentence reduced considering the first-offender status and restitution of the stolen article..."],
];

const civilCases = [
  ["M/s Orion Traders vs. Kapoor Exports", "2023 SCC Online Del 1840", "Delhi High Court", "Civil Suit", 90, "Damages for breach of contract assessed under Section 73 of the Contract Act; the plaintiff must prove loss and mitigation..."],
  ["Sharma Builders vs. Verma", "2022 SCC Online All 975", "Allahabad High Court", "Civil Appeal", 81, "Limitation for recovery under a written agreement starts when the breach occurs, not when notice is served..."],
  ["Gupta & Sons vs. Nexus Pvt. Ltd.", "2021 (4) RCR (Civil) 188", "Supreme Court", "Civil Appeal", 74, "Interim injunction requires prima facie case, balance of convenience and irreparable injury under Order XXXIX CPC..."],
  ["Mehta vs. Delta Infra", "2020 SCC Online Bom 2203", "Bombay High Court", "Commercial Suit", 66, "Liquidated damages clause enforced only to the extent of reasonable compensation (Section 74)..."],
  ["Kumar Estates vs. Singh", "2019 SCC Online MP 1054", "Madhya Pradesh High Court", "Civil Suit", 60, "Specific performance refused where the plaintiff was not ready and willing throughout..."],
  ["Bansal vs. City Developers", "2018 SCC Online Raj 760", "Rajasthan High Court", "Civil Appeal", 55, "Oral evidence cannot contradict the terms of a written contract (Section 92 Evidence Act)..."],
];

const writCases = [
  ["Devi Prasad vs. Union of India", "2023 SCC Online SC 1102", "Supreme Court", "Writ Petition", 91, "Writ jurisdiction under Article 226 is available where there is a violation of fundamental rights or natural justice..."],
  ["Rao vs. State of Telangana", "2022 SCC Online TS 880", "Telangana High Court", "Writ Petition", 80, "Unexplained delay defeats a writ petition; courts apply the doctrine of laches strictly..."],
  ["Municipal Board vs. Begum", "2021 SCC Online All 3112", "Allahabad High Court", "Writ Petition", 72, "Acquisition without proper notice violates Article 300A; compensation must be paid within a reasonable time..."],
  ["Singh vs. State of Punjab", "2020 SCC Online P&H 540", "Punjab & Haryana High Court", "Writ Petition", 64, "Arbitrary action by a public authority is subject to judicial review under Article 14..."],
  ["Nair vs. Union of India", "2019 SCC Online Ker 1730", "Kerala High Court", "Writ Petition", 58, "Alternative statutory remedy ordinarily bars a writ, except where the order is without jurisdiction..."],
  ["Das vs. Collector", "2018 SCC Online Cal 2285", "Calcutta High Court", "Writ Petition", 52, "Reasoned orders are a facet of natural justice; non-speaking orders were quashed and remanded..."],
];

const mvCases = [
  ["New India Assurance vs. Kumari", "2023 SCC Online SC 640", "Supreme Court", "Motor Accident Claim", 91, "Compensation under Section 166 computed using the multiplier method; future prospects added for the deceased..."],
  ["Sarla vs. Transport Corporation", "2022 SCC Online All 2004", "Allahabad High Court", "Motor Accident Claim", 82, "Contributory negligence apportioned 20% where the claimant was riding without a helmet..."],
  ["United India Insurance vs. Yadav", "2021 SCC Online Del 2711", "Delhi High Court", "Insurance Appeal", 73, "Insurer remains liable to pay and recover from the owner where the licence defence is only technical (Section 149)..."],
  ["Khan vs. State Road Transport", "2020 SCC Online Bom 1304", "Bombay High Court", "Motor Accident Claim", 65, "No-fault liability under Section 140 is payable irrespective of negligence..."],
  ["Reddy vs. Oriental Insurance", "2019 SCC Online AP 912", "Andhra Pradesh High Court", "Motor Accident Claim", 57, "Medical bills proved by treating-doctor evidence were awarded in full..."],
  ["Joshi vs. RTO", "2018 SCC Online MP 1666", "Madhya Pradesh High Court", "Licence Appeal", 51, "Licence cancellation requires a show-cause notice and an opportunity of hearing..."],
];

const bank = { Criminal: criminalCases, Civil: civilCases, Writ: writCases, "Motor Vehicle": mvCases };

const slug = (type) => type.toLowerCase().replace(/\s+/g, "");

const toSimilar = (rows, prefix) =>
  rows.map(([title, cite, court, category, score, excerpt], i) => ({
    id: `${prefix}${i + 1}`, title, cite, court, category, score, excerpt,
    relevance: score >= 85 ? "Highly Relevant" : score >= 70 ? "Relevant" : "Partially Relevant",
  }));

const topics = {
  Criminal: {
    questions: [
      { q: "Whether possession of stolen property is sufficient for conviction under Section 379 IPC?", a: "Possession alone is not enough. The prosecution must show dishonest taking (Section 378) or, where property is recovered later, that the possession is recent and unexplained so the presumption under Section 114(a) of the Evidence Act can apply. In State of U.P. vs. Mohan Singh the court held that intent has to be proven beyond reasonable doubt." },
      { q: "What is the evidentiary value of CCTV footage in theft cases?", a: "Footage is an electronic record, so it is admissible only with a certificate under Section 65B of the Evidence Act. Clear, authenticated footage that identifies the accused is strong corroboration; poor-quality footage proves presence at most, not intent to steal." },
      { q: "Can benefit of doubt be claimed if there is no direct witness?", a: "Yes. When the case rests on circumstances and the chain of custody has gaps, the accused is entitled to the benefit of doubt. State vs. Amit Kumar (2022) acquitted on exactly this reasoning." },
    ],
    laws: [
      { title: "Section 379 IPC", note: "Punishment for theft - imprisonment up to 3 years or fine or both", detail: "Theft is defined in Section 378: dishonestly taking movable property out of someone's possession without consent. Section 379 prescribes the punishment." },
      { title: "Section 411 IPC", note: "Dishonestly receiving stolen property", detail: "Applies to a person who receives or retains property knowing, or having reason to believe, that it is stolen." },
      { title: "Indian Evidence Act, 1872", note: "Sections related to electronic evidence (Section 65B)", detail: "Section 65B sets the conditions and certificate needed to admit electronic records such as CCTV footage." },
      { title: "Criminal Procedure Code, 1973", note: "Provisions related to investigation and trial", detail: "Sections 154 (FIR), 173 (chargesheet) and 313 (examination of the accused) frame the procedure in this matter." },
    ],
    strengths: ["No direct eyewitnesses", "CCTV footage not conclusive", "Possession alone may not prove intent", "Chain of custody not clearly established"],
    weaknesses: ["Recovery of mobile phone", "CCTV shows presence near scene", "Witness statements available", "Chargesheet filed by police"],
  },
  Civil: {
    questions: [
      { q: "Is the claim within the limitation period?", a: "For breach of a written contract the three-year period under Article 55 of the Limitation Act normally runs from the date of breach. Acknowledgements in writing can extend it under Section 18." },
      { q: "What must the plaintiff prove to recover damages?", a: "A valid contract, breach by the defendant, and actual loss caused by the breach (Section 73, Contract Act). The plaintiff must also show reasonable steps to mitigate the loss." },
      { q: "Can an interim injunction be obtained?", a: "Only if a prima facie case, balance of convenience and irreparable injury are all shown under Order XXXIX Rules 1 and 2 CPC." },
    ],
    laws: [
      { title: "Indian Contract Act, 1872", note: "Sections 73-74: compensation for breach", detail: "Section 73 allows compensation for natural and probable loss; Section 74 governs stipulated damages." },
      { title: "Limitation Act, 1963", note: "Article 55 and Section 18", detail: "Sets the three-year period for contract claims and how acknowledgements extend it." },
      { title: "Code of Civil Procedure, 1908", note: "Order XXXIX - temporary injunctions", detail: "Conditions and procedure for interim relief pending the final decision." },
      { title: "Specific Relief Act, 1963", note: "Specific performance and injunctions", detail: "Applies where damages are an inadequate remedy and the plaintiff is ready and willing to perform." },
    ],
    strengths: ["Written agreement on record", "Payment trail documented", "Notice served within limitation", "Defendant's partial performance"],
    weaknesses: ["Disputed quantum of loss", "Delay in sending legal notice", "Clause limiting liability", "Oral assurances not recorded"],
  },
  Writ: {
    questions: [
      { q: "Is the writ petition maintainable under Article 226?", a: "Yes if a fundamental right, a statutory duty or natural justice is in issue. An efficacious alternative remedy usually bars the writ unless the order is without jurisdiction or violates fundamental rights." },
      { q: "Does delay affect the petition?", a: "Unexplained delay can defeat the petition under the doctrine of laches; the petitioner should explain each stage of the delay." },
      { q: "What relief can the court grant?", a: "Certiorari, mandamus, prohibition or directions to the authority, together with costs where the action was arbitrary." },
    ],
    laws: [
      { title: "Article 226, Constitution of India", note: "Power of High Courts to issue writs", detail: "Wider than Article 32: available for fundamental rights and any other legal right." },
      { title: "Article 14", note: "Equality before law", detail: "Arbitrary State action is tested against this guarantee." },
      { title: "Article 300A", note: "Right to property", detail: "No person can be deprived of property except by authority of law." },
      { title: "Principles of natural justice", note: "Notice, hearing and reasoned orders", detail: "Orders passed without hearing the affected party are liable to be set aside." },
    ],
    strengths: ["Order passed without notice", "No reasons recorded", "Similar cases treated differently", "Petition filed promptly"],
    weaknesses: ["Alternative remedy available", "Disputed questions of fact", "Authority acted under statute", "Interim relief unlikely"],
  },
  "Motor Vehicle": {
    questions: [
      { q: "How is compensation calculated?", a: "By the multiplier method: annual dependency multiplied by the age-based multiplier, plus future prospects and conventional heads (Section 166, Motor Vehicles Act)." },
      { q: "Is there contributory negligence?", a: "Courts apportion fault where the claimant also failed to take care, for example riding without a helmet; the award is reduced proportionately." },
      { q: "Is the insurer liable?", a: "Generally yes under Section 149, with a right of recovery from the owner if a policy condition was breached." },
    ],
    laws: [
      { title: "Motor Vehicles Act, 1988 - Section 166", note: "Application for compensation", detail: "Sets out who may claim and before which Tribunal." },
      { title: "Section 140", note: "No-fault liability", detail: "Fixed compensation payable irrespective of who was at fault." },
      { title: "Section 149", note: "Duty of insurers to satisfy judgments", detail: "Insurer must pay third-party claims subject to limited defences." },
      { title: "Sarla Verma multiplier", note: "Judicial guidelines on computation", detail: "The table of multipliers and deductions used by Tribunals." },
    ],
    strengths: ["FIR and site plan on record", "Medical bills documented", "Insurance policy valid on date", "Independent eyewitness"],
    weaknesses: ["Allegation of rash driving by claimant", "Income proof is informal", "Delay in intimation to insurer", "Disputed point of impact"],
  },
};

// everything the AI page shows for one case
export function analysisFor(c, hearings = [], docs = []) {
  const t = topics[c.type] ?? topics.Criminal;
  const done = hearings.filter((h) => h.status === "Completed").sort((a, b) => b.date.localeCompare(a.date))[0];
  const next = hearings.filter((h) => h.status === "Scheduled").sort((a, b) => a.date.localeCompare(b.date))[0];
  const stage = c.status === "Closed" ? "Closed" : done?.purpose ?? next?.purpose ?? "Filed";
  const fir = c.firNo && c.firNo !== "-" ? `The FIR (${c.firNo}) has been registered. ` : "";
  const text = `${c.subtitle}. ${fir}${c.description} The matter is listed before ${c.court}${next ? `, with the next hearing on ${formatDate(next.date)} for ${next.purpose.toLowerCase()}` : ""}. ${docs.length} document${docs.length === 1 ? "" : "s"} on file.`;

  return {
    summary: {
      text,
      facts: [
        ["Case Type", c.type], ["Main Section", c.sections && c.sections !== "-" ? c.sections : "-"], ["Current Stage", stage],
        ["Court", c.court], ["Next Hearing", next ? formatDate(next.date) : "-"], ["Status", c.status],
      ],
    },
    questions: t.questions,
    laws: t.laws,
    strengths: t.strengths,
    weaknesses: t.weaknesses,
    similar: toSimilar(bank[c.type] ?? criminalCases, `${slug(bank[c.type] ? c.type : "Criminal")}-`),
  };
}

// lines for the downloadable report
export function reportLines(c, a) {
  return [
    `Case: ${c.title} (${c.caseNo})`,
    "",
    "SUMMARY",
    ...a.summary.text.match(/.{1,92}(\s|$)/g).map((l) => l.trim()),
    "",
    "KEY QUESTIONS",
    ...a.questions.map((q, i) => `${i + 1}. ${q.q}`.slice(0, 96)),
    "",
    "APPLICABLE LAWS",
    ...a.laws.map((l) => `- ${l.title}: ${l.note}`.slice(0, 96)),
    "",
    "Generated by the LexPro demo. Sample output only.",
  ];
}

// every judgment, tagged with its case type, for the Case Reference library
export const allJudgments = Object.entries(bank).flatMap(([type, rows]) =>
  toSimilar(rows, `${slug(type)}-`).map((j) => ({ ...j, type, year: Number(j.cite.match(/\d{4}/)?.[0] ?? 0) }))
);

// every statute mentioned across the topics, de-duplicated
export const allStatutes = Object.entries(topics).flatMap(([type, t]) => t.laws.map((l) => ({ ...l, type })));

export const relevanceBadge = { "Highly Relevant": "bg-emerald-50 text-emerald-600", Relevant: "bg-sky-50 text-sky-600", "Partially Relevant": "bg-purple-50 text-purple-600" };
export const matchColor = (v) => (v >= 90 ? "bg-emerald-500" : v >= 75 ? "bg-sky-500" : v >= 70 ? "bg-pink-500" : "bg-purple-500");

export const judgmentById = (id) => allJudgments.find((j) => j.id === id) ?? null;
export const lawsForType = (type) => (topics[type] ?? topics.Criminal).laws;
