// [title, subtitle, caseNo, client, type, status, court, hearingDate, hearingTime, updated]
const rows = [
  ["State vs. Rajesh Kumar", "Theft under Section 379 IPC", "CR/2026/145", "Rajesh Kumar", "Criminal", "Active", "Court No. 3", "2026-10-05", "10:30 AM", "2026-09-28"],
  ["Anita Sharma vs. M/s ABC Ltd.", "Contract Dispute", "CS/2026/089", "Anita Sharma", "Civil", "Active", "Court No. 5", "2026-10-06", "11:00 AM", "2026-09-27"],
  ["Rohan vs. State", "Criminal Appeal", "CR/2026/211", "Rohan", "Criminal", "Active", "High Court", "2026-10-08", "02:30 PM", "2026-09-25"],
  ["Meera Devi vs. Union of India", "Writ Petition", "WP/2026/076", "Meera Devi", "Writ", "Pending", "High Court", "2026-10-15", "12:00 PM", "2026-09-22"],
  ["Karan Singh vs. RTO", "Motor Vehicle Act Violation", "MV/2026/054", "Karan Singh", "Motor Vehicle", "Closed", "District Court", null, null, "2026-09-20"],
  ["Sunita vs. City Corporation", "Property Tax Dispute", "CS/2026/132", "Sunita Devi", "Civil", "Active", "Court No. 5", "2026-10-20", "11:00 AM", "2026-09-19"],
  ["Vikram vs. State", "Bail Application", "CR/2026/198", "Vikram", "Criminal", "Active", "Court No. 3", "2026-10-22", "03:00 PM", "2026-09-18"],
  ["ABC Ltd. vs. DEF Corp.", "Commercial Suit", "CS/2026/201", "ABC Ltd.", "Civil", "Pending", "High Court", "2026-10-25", "10:00 AM", "2026-09-16"],
  ["Rahul vs. Insurance Co.", "Insurance Claim", "CS/2026/176", "Rahul Verma", "Civil", "Active", "Court No. 5", "2026-10-28", "12:30 PM", "2026-09-14"],
  ["State vs. Imran Khan", "NDPS Act", "CR/2026/167", "Imran Khan", "Criminal", "Closed", "Court No. 3", null, null, "2026-09-12"],
  ["Pooja Mehta vs. State", "Domestic Violence Act", "CR/2026/220", "Pooja Mehta", "Criminal", "Active", "Court No. 3", "2026-11-02", "10:30 AM", "2026-09-10"],
  ["Gupta Traders vs. GST Dept.", "Tax Appeal", "WP/2026/083", "Gupta Traders", "Writ", "Active", "High Court", "2026-11-04", "11:30 AM", "2026-09-09"],
  ["Ramesh vs. Neha Sharma", "Divorce Petition", "FC/2026/045", "Ramesh Sharma", "Civil", "Active", "Family Court", "2026-11-06", "02:00 PM", "2026-09-08"],
  ["Ajay Kumar vs. State Bank", "Loan Recovery", "CS/2026/145", "Ajay Kumar", "Civil", "Active", "District Court", "2026-11-08", "10:00 AM", "2026-09-06"],
  ["Sanjay vs. Transport Dept.", "Licence Cancellation", "MV/2026/061", "Sanjay Yadav", "Motor Vehicle", "Active", "District Court", "2026-11-10", "12:00 PM", "2026-09-05"],
  ["State vs. Deepak Joshi", "Cheating under Section 420 IPC", "CR/2026/232", "Deepak Joshi", "Criminal", "Active", "Court No. 3", "2026-11-12", "10:30 AM", "2026-09-04"],
  ["Fatima Begum vs. Municipal Board", "Land Acquisition", "WP/2026/091", "Fatima Begum", "Writ", "Active", "High Court", "2026-11-14", "11:00 AM", "2026-09-03"],
  ["Mohan Lal vs. Sharma Estates", "Property Partition", "CS/2026/218", "Mohan Lal", "Civil", "Active", "Court No. 5", "2026-11-17", "03:30 PM", "2026-09-02"],
  ["Priya vs. National Insurance", "Accident Claim", "MV/2026/072", "Priya Nair", "Motor Vehicle", "Active", "District Court", "2026-11-19", "10:00 AM", "2026-09-01"],
  ["State vs. Arjun Singh", "Bail Application", "CR/2026/240", "Arjun Singh", "Criminal", "Active", "Court No. 3", "2026-11-21", "12:00 PM", "2026-08-30"],
  ["Tech Solutions vs. Alpha Pvt. Ltd.", "Arbitration Matter", "CS/2026/230", "Tech Solutions", "Civil", "Pending", "High Court", "2026-12-01", "11:00 AM", "2026-08-28"],
  ["Kavita vs. State", "Quashing Petition", "CR/2026/121", "Kavita Rao", "Criminal", "Closed", "High Court", null, null, "2026-08-25"],
  ["Salim vs. RTO", "Challan Dispute", "MV/2026/033", "Salim Khan", "Motor Vehicle", "Closed", "District Court", null, null, "2026-08-22"],
  ["Neelam Devi vs. State", "Pension Dues", "WP/2026/049", "Neelam Devi", "Writ", "Closed", "High Court", null, null, "2026-08-18"],
];

export const allCases = rows.map(
  ([title, subtitle, caseNo, client, type, status, court, hearingDate, hearingTime, updated]) => ({
    title, subtitle, caseNo, client, type, status, court, hearingDate, hearingTime, updated,
  })
);

// "CR/2026/145" -> "cr-2026-145" (slashes can't live in a URL segment)
export const caseSlug = (caseNo) => caseNo.replaceAll("/", "-").toLowerCase();

export const caseTypes =["Criminal", "Civil", "Writ", "Motor Vehicle"];
export const caseStatuses = ["Active", "Pending", "Closed", "Draft"];
export const courts = [...new Set(allCases.map((c) => c.court))];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-10-05" -> "05 Oct 2026" (manual so server and client render the same)
export function formatDate(iso) {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-");
  return `${d} ${MONTHS[Number(m) - 1]} ${y}`;
}
