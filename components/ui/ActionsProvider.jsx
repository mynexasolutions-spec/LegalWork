"use client";

import { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import FormModal from "./FormModal";
import ConfirmDialog from "./ConfirmDialog";
import Modal from "./Modal";
import { useToast } from "./Toast";
import { useStore, nextCaseNo } from "@/lib/store";
import { uid, to12h, to24h, isoOf, kindOf, parseCsv } from "@/lib/format";
import { caseSlug, caseTypes, formatDate } from "@/lib/cases";
import { docTypes } from "@/lib/documents";
import { allPermissions, roleDefs, roleOptions } from "@/lib/team";
import { fileBlobs, downloadDocument } from "@/lib/files";

const Ctx = createContext(null);
export const useActions = () => useContext(Ctx);

const courts = ["District Court", "Court No. 3", "Court No. 5", "High Court", "Sessions Court", "Commercial Court", "Family Court", "Supreme Court"];
const purposes = ["Arguments", "Evidence recording", "Framing of charges", "Plea hearing", "Final arguments", "Written submissions", "Hearing"];
const reminderIcon = { Hearing: "doc", Document: "upload", Meeting: "users", Task: "check", Call: "phone" };
const emailOk = (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : "Enter a valid email address");
const nowStamp = () =>
  new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });

export default function ActionsProvider({ children }) {
  const s = useStore();
  const toast = useToast();
  const router = useRouter();
  const [modal, setModal] = useState(null);
  const close = () => setModal(null);
  const show = (el) => setModal(el);

  const todayStr = () => isoOf(new Date());
  const caseOptions = (includeClosed = false) =>
    s.cases.filter((c) => includeClosed || c.status !== "Closed").map((c) => ({ value: c.caseNo, label: `${c.title} (${c.caseNo})` }));

  const bumpClient = (name, total, active) => {
    const c = s.clients.find((x) => x.name.toLowerCase() === name.toLowerCase());
    if (c) s.updateClient(c.id, { totalCases: Math.max(0, c.totalCases + total), activeCases: Math.max(0, c.activeCases + active) });
  };

  const makeDocs = (files, { caseNo, type }) =>
    files.map((f) => {
      const d = new Date();
      const time = to12h(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
      const doc = {
        id: uid("doc"), name: f.name, caseNo: caseNo || "", caseTitle: caseNo ? s.caseTitle(caseNo) : "General",
        type, date: todayStr(), time, sizeKb: Math.max(1, Math.round(f.size / 1024)), by: "Harsh Kumar",
        ts: `${todayStr()}T${to24h(time)}`, kind: kindOf(f.name), trashed: false,
      };
      fileBlobs.set(doc.id, f);
      return doc;
    });

  const act = {
    show, close,
    confirm: (opts) => show(<ConfirmDialog {...opts} onClose={close} />),

    // ---------------- cases ----------------
    addCase(prefill = {}) {
      show(
        <FormModal
          size="lg"
          title="Upload Case File"
          subtitle="Create a new case and attach its documents."
          submitLabel="Create Case"
          initial={{ type: "Criminal", court: "District Court", status: "Active", filed: todayStr(), ...prefill }}
          onClose={close}
          fields={[
            { name: "title", label: "Case Title", required: true, full: true, placeholder: "e.g. State vs. Ramesh Singh" },
            { name: "subtitle", label: "Nature of Case", full: true, placeholder: "e.g. Theft under Section 379 IPC" },
            { name: "client", label: "Client", required: true, options: s.clients.map((c) => c.name), hint: "Pick an existing client or type a new name" },
            { name: "type", label: "Case Type", type: "select", required: true, options: caseTypes },
            { name: "court", label: "Court", options: courts, required: true },
            { name: "status", label: "Status", type: "select", required: true, options: ["Active", "Pending"] },
            { name: "firNo", label: "FIR No. (optional)" },
            { name: "sections", label: "Sections / Acts (optional)" },
            { name: "filed", label: "Filing Date", type: "date", required: true },
            { name: "hearingDate", label: "First Hearing Date", type: "date", hint: "Optional - adds it to Upcoming Hearings" },
            { name: "hearingTime", label: "Hearing Time", type: "time", default: "10:30", visible: (v) => !!v.hearingDate },
            { name: "description", label: "Description", type: "textarea" },
            { name: "files", label: "Case Documents", type: "file", multiple: true, accept: ".pdf,.doc,.docx,.txt,.jpg,.png,.zip,.xlsx", hint: "PDF, DOC, images (optional)" },
          ]}
          onSubmit={(v) => {
            const caseNo = nextCaseNo(s.cases, v.type);
            const client = v.client.trim();
            const isNew = !s.clients.some((c) => c.name.toLowerCase() === client.toLowerCase());
            if (isNew) {
              s.addClient({ name: client, type: "Individual", phone: "", email: "", city: "", address: "", identity: "-", totalCases: 1, activeCases: v.status === "Active" ? 1 : 0 });
            }
            const created = s.addCase({
              id: caseSlug(caseNo), caseNo, title: v.title.trim(), subtitle: v.subtitle.trim() || v.type + " matter", client, type: v.type, court: v.court,
              status: v.status, firNo: v.firNo || "-", sections: v.sections || "-", filed: v.filed, description: v.description || v.subtitle || "-",
              parties: [
                { id: uid("p"), role: "Petitioner / Client", name: client, note: "", kind: "person" },
                { id: uid("p"), role: "Advocate", name: "Adv. Suresh Mehta", note: "Reg. No. D/12345", kind: "person" },
              ],
            });
            if (v.hearingDate) s.addHearing({ caseNo, date: v.hearingDate, time: to12h(v.hearingTime || "10:30"), court: v.court, purpose: "Hearing" });
            if (v.files.length) s.addDocuments(makeDocs(v.files, { caseNo, type: "Case File" }));
            if (!isNew) bumpClient(client, 1, v.status === "Active" ? 1 : 0);
            toast(`Case ${caseNo} created`);
            router.push(`/cases/${created.id}`);
          }}
        />
      );
    },

    editCase(c) {
      show(
        <FormModal
          size="lg"
          title="Edit Case"
          subtitle={c.caseNo}
          initial={c}
          onClose={close}
          fields={[
            { name: "title", label: "Case Title", required: true, full: true },
            { name: "subtitle", label: "Nature of Case", full: true },
            { name: "client", label: "Client", required: true, options: s.clients.map((x) => x.name) },
            { name: "type", label: "Case Type", type: "select", required: true, options: caseTypes },
            { name: "court", label: "Court", options: courts, required: true },
            ...(c.status === "Closed" ? [] : [{ name: "status", label: "Status", type: "select", required: true, options: ["Active", "Pending"] }]),
            { name: "firNo", label: "FIR No." },
            { name: "sections", label: "Sections / Acts" },
            { name: "filed", label: "Filing Date", type: "date", required: true },
            { name: "description", label: "Description", type: "textarea" },
          ]}
          onSubmit={(v) => {
            const { files, ...rest } = v;
            s.updateCase(c.caseNo, rest);
            s.log(`Edited case ${v.title}`);
            toast("Case updated");
          }}
        />
      );
    },

    closeCase(c) {
      show(
        <FormModal
          size="sm"
          title="Close Case"
          subtitle={c.title}
          submitLabel="Close Case"
          initial={{ closedDate: todayStr(), result: "Won" }}
          onClose={close}
          fields={[
            { name: "result", label: "Outcome", type: "select", required: true, options: ["Won", "Lost", "Settled", "Disposed"] },
            { name: "closedDate", label: "Closed On", type: "date", required: true },
            { name: "remarks", label: "Closing Remarks", type: "textarea" },
          ]}
          onSubmit={(v) => {
            s.closeCase(c.caseNo, v.result, v.closedDate);
            if (v.remarks.trim()) s.addNote(`case:${c.caseNo}`, { by: "Harsh Kumar", at: nowStamp(), ts: new Date().toISOString(), text: `Case closed (${v.result}): ${v.remarks.trim()}` });
            bumpClient(c.client, 0, c.status === "Active" ? -1 : 0);
            s.log(`Closed case ${c.title} (${v.result})`);
            toast("Case closed");
          }}
        />
      );
    },

    reopenCase(c) {
      s.reopenCase(c.caseNo);
      bumpClient(c.client, 0, 1);
      s.log(`Reopened case ${c.title}`);
      toast("Case reopened");
    },

    deleteCase(c, after) {
      act.confirm({
        title: "Delete case?",
        message: `"${c.title}" and its hearings and reminders will be removed. Its documents move to Trash.`,
        confirmLabel: "Delete Case",
        danger: true,
        onConfirm: () => {
          s.deleteCase(c.caseNo);
          bumpClient(c.client, -1, c.status === "Active" ? -1 : 0);
          s.log(`Deleted case ${c.title}`);
          toast("Case deleted");
          after?.();
        },
      });
    },

    addParty(c) {
      show(
        <FormModal
          title="Add Party"
          subtitle={c.title}
          submitLabel="Add Party"
          initial={{ kind: "person" }}
          onClose={close}
          fields={[
            { name: "role", label: "Role", required: true, options: ["Petitioner / Accused", "Respondent", "Witness", "Investigating Officer", "Advocate (Opposite)", "Expert"] },
            { name: "name", label: "Name", required: true },
            { name: "note", label: "Details", placeholder: "e.g. S/o ..., Reg. No. ..." },
            { name: "phone", label: "Phone", type: "tel" },
            { name: "kind", label: "Type", type: "select", options: [{ value: "person", label: "Individual" }, { value: "govt", label: "Government / Organisation" }, { value: "officer", label: "Officer" }] },
          ]}
          onSubmit={(v) => { s.addParty(c.caseNo, v); toast("Party added"); }}
        />
      );
    },

    addKeyDate(c) {
      show(
        <FormModal
          size="sm"
          title="Add Key Date"
          subtitle={c.title}
          onClose={close}
          fields={[
            { name: "label", label: "Label", required: true, placeholder: "e.g. Charge Framed" },
            { name: "date", label: "Date", type: "date", required: true },
          ]}
          onSubmit={(v) => { s.addKeyDate(c.caseNo, v); toast("Date added"); }}
        />
      );
    },

    // ---------------- hearings ----------------
    addHearing(prefill = {}) {
      const locked = !!prefill.caseNo;
      const c = s.cases.find((x) => x.caseNo === prefill.caseNo);
      show(
        <FormModal
          title="Add Hearing"
          subtitle={c?.title}
          submitLabel="Schedule Hearing"
          initial={{ date: todayStr(), time: "10:30", purpose: "Hearing", court: c?.court ?? "", ...prefill }}
          onClose={close}
          fields={[
            { name: "caseNo", label: "Case", type: "select", required: true, full: true, options: caseOptions(), disabled: locked },
            { name: "date", label: "Date", type: "date", required: true },
            { name: "time", label: "Time", type: "time", required: true },
            { name: "purpose", label: "Purpose", options: purposes, required: true },
            { name: "court", label: "Court", options: courts },
          ]}
          onSubmit={(v) => {
            const cs = s.cases.find((x) => x.caseNo === v.caseNo);
            s.addHearing({ caseNo: v.caseNo, date: v.date, time: to12h(v.time), purpose: v.purpose, court: v.court || cs?.court || "" });
            s.log(`Scheduled hearing for ${cs?.title}`);
            toast("Hearing scheduled");
          }}
        />
      );
    },

    editHearing(h) {
      show(
        <FormModal
          title="Update Hearing"
          subtitle={s.caseTitle(h.caseNo)}
          initial={{ ...h, time: to24h(h.time) }}
          onClose={close}
          fields={[
            { name: "date", label: "Date", type: "date", required: true },
            { name: "time", label: "Time", type: "time", required: true },
            { name: "purpose", label: "Purpose", options: purposes, required: true },
            { name: "court", label: "Court", options: courts },
            { name: "status", label: "Status", type: "select", required: true, options: ["Scheduled", "Completed", "Cancelled"] },
            { name: "remarks", label: "Order / Remarks", type: "textarea" },
          ]}
          onSubmit={(v) => { s.updateHearing(h.id, { ...v, time: to12h(v.time) }); toast("Hearing updated"); }}
        />
      );
    },

    completeHearing(h) {
      show(
        <FormModal
          title="Mark Hearing Completed"
          subtitle={`${s.caseTitle(h.caseNo)} - ${formatDate(h.date)}`}
          submitLabel="Mark Completed"
          onClose={close}
          fields={[
            { name: "remarks", label: "Order / Remarks", type: "textarea", placeholder: "What happened in court?" },
            { name: "nextDate", label: "Next Hearing Date", type: "date", hint: "Optional - schedules the next hearing" },
            { name: "nextTime", label: "Next Hearing Time", type: "time", default: "10:30", visible: (v) => !!v.nextDate },
          ]}
          onSubmit={(v) => {
            s.updateHearing(h.id, { status: "Completed", remarks: v.remarks.trim() });
            if (v.nextDate) s.addHearing({ caseNo: h.caseNo, date: v.nextDate, time: to12h(v.nextTime || "10:30"), court: h.court, purpose: "Hearing" });
            s.log(`Completed hearing for ${s.caseTitle(h.caseNo)}`);
            toast(v.nextDate ? "Hearing completed, next one scheduled" : "Hearing marked completed");
          }}
        />
      );
    },

    viewHearing(h) {
      const rows = [["Case", s.caseTitle(h.caseNo)], ["Case No.", h.caseNo], ["Date", `${formatDate(h.date)}, ${h.time}`], ["Court", h.court || "-"], ["Purpose", h.purpose], ["Status", h.status], ["Order / Remarks", h.remarks || "-"]];
      show(
        <Modal
          title="Hearing Details"
          size="sm"
          onClose={close}
          footer={
            <>
              <button onClick={() => { close(); act.editHearing(h); }} className="rounded-lg border border-line px-5 py-2.5 text-sm font-medium hover:bg-slate-50">Edit</button>
              {h.status === "Scheduled" && <button onClick={() => { close(); act.completeHearing(h); }} className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">Mark Completed</button>}
            </>
          }
        >
          <dl className="divide-y divide-line text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[120px_1fr] gap-3 py-2.5"><dt className="text-slate-500">{k}</dt><dd className="font-medium">{v}</dd></div>
            ))}
          </dl>
        </Modal>
      );
    },

    deleteHearing(h, after) {
      act.confirm({
        title: "Delete hearing?",
        message: `The hearing on ${formatDate(h.date)} for "${s.caseTitle(h.caseNo)}" will be removed.`,
        confirmLabel: "Delete",
        danger: true,
        onConfirm: () => { s.deleteHearing(h.id); toast("Hearing deleted"); after?.(); },
      });
    },

    // ---------------- reminders ----------------
    addReminder(prefill = {}) {
      show(
        <FormModal
          title="Add Reminder"
          submitLabel="Add Reminder"
          initial={{ type: "Task", priority: "Medium", date: todayStr(), time: "10:00", ...prefill }}
          onClose={close}
          fields={[
            { name: "title", label: "Title", required: true, full: true, placeholder: "e.g. Prepare written arguments" },
            { name: "note", label: "Note", full: true },
            { name: "caseNo", label: "Related Case", type: "select", full: true, options: caseOptions(true), placeholder: "No related case" },
            { name: "type", label: "Type", type: "select", required: true, options: ["Hearing", "Document", "Meeting", "Task", "Call"] },
            { name: "priority", label: "Priority", type: "select", required: true, options: ["High", "Medium", "Low"] },
            { name: "date", label: "Date", type: "date", required: true },
            { name: "time", label: "Time", type: "time", required: true },
          ]}
          onSubmit={(v) => {
            s.addReminder({ title: v.title.trim(), note: v.note || "-", caseNo: v.caseNo, type: v.type, priority: v.priority, date: v.date, time: to12h(v.time), icon: reminderIcon[v.type] });
            toast("Reminder added");
          }}
        />
      );
    },

    editReminder(r) {
      show(
        <FormModal
          title="Edit Reminder"
          initial={{ ...r, time: to24h(r.time) }}
          onClose={close}
          fields={[
            { name: "title", label: "Title", required: true, full: true },
            { name: "note", label: "Note", full: true },
            { name: "caseNo", label: "Related Case", type: "select", full: true, options: caseOptions(true), placeholder: "No related case" },
            { name: "type", label: "Type", type: "select", required: true, options: ["Hearing", "Document", "Meeting", "Task", "Call"] },
            { name: "priority", label: "Priority", type: "select", required: true, options: ["High", "Medium", "Low"] },
            { name: "date", label: "Date", type: "date", required: true },
            { name: "time", label: "Time", type: "time", required: true },
          ]}
          onSubmit={(v) => { s.updateReminder(r.id, { title: v.title.trim(), note: v.note, caseNo: v.caseNo, type: v.type, priority: v.priority, date: v.date, time: to12h(v.time), icon: reminderIcon[v.type] }); toast("Reminder updated"); }}
        />
      );
    },

    deleteReminders(ids, after) {
      act.confirm({
        title: ids.length > 1 ? `Delete ${ids.length} reminders?` : "Delete reminder?",
        message: "This can't be undone.",
        confirmLabel: "Delete",
        danger: true,
        onConfirm: () => { s.deleteReminders(ids); toast(ids.length > 1 ? "Reminders deleted" : "Reminder deleted"); after?.(); },
      });
    },

    // ---------------- clients ----------------
    addClient() {
      show(<ClientForm title="Add Client" submitLabel="Add Client" initial={{ type: "Individual" }} onSubmit={(v) => { const c = s.addClient(v); toast(`${v.name} added`); router.push(`/clients/${c.id}`); }} onClose={close} />);
    },
    editClient(c) {
      show(<ClientForm title="Edit Client" initial={c} onSubmit={(v) => { s.updateClient(c.id, v); toast("Client updated"); }} onClose={close} />);
    },
    deleteClient(c, after) {
      act.confirm({
        title: "Delete client?",
        message: `${c.name} will be removed from your client list. Their cases stay in place.`,
        confirmLabel: "Delete Client",
        danger: true,
        onConfirm: () => { s.deleteClient(c.id); s.log(`Deleted client ${c.name}`); toast("Client deleted"); after?.(); },
      });
    },
    toggleClientStatus(c) {
      s.updateClient(c.id, { status: c.status === "Active" ? "Inactive" : "Active" });
      toast(`${c.name} marked ${c.status === "Active" ? "inactive" : "active"}`);
    },
    emailClient(c) {
      if (!c.email) return toast("No email address on file for this client", "error");
      window.location.href = `mailto:${c.email}?subject=${encodeURIComponent("Regarding your case")}`;
      toast(`Opening email to ${c.email}`, "info");
    },
    async importClients(file) {
      const rows = parseCsv(await file.text());
      const body = /^name$/i.test((rows[0]?.[0] ?? "").trim()) ? rows.slice(1) : rows;
      const added = body.filter((r) => r[0]?.trim()).map((r) => ({ name: r[0].trim(), type: /corp/i.test(r[1] ?? "") ? "Corporate" : "Individual", phone: (r[2] ?? "").trim(), email: (r[3] ?? "").trim(), city: (r[4] ?? "").trim(), address: (r[4] ?? "").trim(), identity: "-" }));
      if (!added.length) return toast("No clients found. Expected columns: name, type, phone, email, city", "error");
      added.forEach((c) => s.addClient(c));
      toast(`Imported ${added.length} client${added.length > 1 ? "s" : ""}`);
    },

    // ---------------- team ----------------
    addMember() {
      show(<MemberForm title="Add Member" submitLabel="Add Member" initial={{ status: "Active", joined: todayStr(), role: "Advocate" }} onSubmit={(v) => { const m = s.addMember(v); toast(`${v.name} added`); router.push(`/team/${m.id}`); }} onClose={close} members={s.members} />);
    },
    editMember(m) {
      show(<MemberForm title="Edit Member" initial={m} onSubmit={(v) => { s.updateMember(m.id, v); toast("Member updated"); }} onClose={close} members={s.members.filter((x) => x.id !== m.id)} />);
    },
    deleteMember(m, after) {
      act.confirm({
        title: "Remove team member?",
        message: `${m.name} will lose access and be removed from the team list.`,
        confirmLabel: "Remove",
        danger: true,
        onConfirm: () => { s.deleteMember(m.id); toast(`${m.name} removed`); after?.(); },
      });
    },
    toggleMemberStatus(m) {
      s.updateMember(m.id, { status: m.status === "Active" ? "Inactive" : "Active" });
      toast(`${m.name} marked ${m.status === "Active" ? "inactive" : "active"}`);
    },
    invite() {
      show(
        <FormModal
          size="sm"
          title="Invite Member"
          subtitle="They'll get an email to join your team."
          submitLabel="Send Invite"
          initial={{ role: "Advocate" }}
          onClose={close}
          fields={[
            { name: "email", label: "Email Address", type: "email", required: true, validate: emailOk },
            { name: "role", label: "Role", type: "select", required: true, options: roleOptions },
          ]}
          onSubmit={(v) => { s.addInvite(v); toast(`Invite sent to ${v.email}`); }}
        />
      );
    },
    roles() {
      show(<RolesModal roles={s.roles} invites={s.invites} onSave={(r) => { s.setRoles(r); toast("Role permissions saved"); }} onRevoke={(id) => { s.revokeInvite(id); toast("Invite revoked"); }} onClose={close} />);
    },

    // ---------------- documents ----------------
    upload(prefill = {}) {
      show(
        <FormModal
          title="Upload Document"
          submitLabel="Upload"
          initial={{ type: "Case File", ...prefill }}
          onClose={close}
          fields={[
            { name: "files", label: "Files", type: "file", multiple: true, required: true, hint: "PDF, Word, Excel, images, ZIP" },
            { name: "caseNo", label: "Related Case", type: "select", options: caseOptions(true), placeholder: "No related case", disabled: !!prefill.caseNo },
            { name: "type", label: "Document Type", type: "select", required: true, options: docTypes },
          ]}
          onSubmit={(v) => {
            s.addDocuments(makeDocs(v.files, { caseNo: v.caseNo, type: v.type }));
            s.log(`Uploaded ${v.files.length} document(s)`);
            toast(`${v.files.length} document${v.files.length > 1 ? "s" : ""} uploaded`);
          }}
        />
      );
    },
    renameDoc(d) {
      show(
        <FormModal
          size="sm"
          title="Rename Document"
          initial={{ name: d.name }}
          onClose={close}
          fields={[{ name: "name", label: "File name", required: true }]}
          onSubmit={(v) => { s.updateDocument(d.id, { name: v.name.trim(), kind: kindOf(v.name) }); toast("Document renamed"); }}
        />
      );
    },
    downloadDoc(d) {
      downloadDocument(d, d.caseNo ? s.caseTitle(d.caseNo) : "General");
      toast(`Downloading ${d.name}`, "info");
    },
    async shareDoc(d) {
      const link = `${window.location.origin}/documents/${d.id}`;
      try {
        await navigator.clipboard.writeText(link);
        toast("Link copied to clipboard");
      } catch {
        toast(link, "info");
      }
    },
    trashDocs(ids, after) {
      s.trashDocuments(ids);
      toast(ids.length > 1 ? `${ids.length} documents moved to Trash` : "Moved to Trash");
      after?.();
    },

    // ---------------- references ----------------
    attachReference({ title, text }) {
      show(
        <FormModal
          size="sm"
          title="Attach to case"
          subtitle={title}
          submitLabel="Attach"
          onClose={close}
          fields={[{ name: "caseNo", label: "Case", type: "select", required: true, options: caseOptions(true) }]}
          onSubmit={(v) => {
            s.addNote(`case:${v.caseNo}`, { by: "Harsh Kumar", at: nowStamp(), ts: new Date().toISOString(), text: `Reference: ${text}` });
            toast("Added to the case notes");
          }}
        />
      );
    },

    // ---------------- notes ----------------
    addNote({ key, title }) {
      show(
        <FormModal
          size="sm"
          title="Add Note"
          subtitle={title}
          submitLabel="Save Note"
          onClose={close}
          fields={[{ name: "text", label: "Note", type: "textarea", required: true, rows: 4 }]}
          onSubmit={(v) => { s.addNote(key, { by: "Harsh Kumar", at: nowStamp(), ts: new Date().toISOString(), text: v.text.trim() }); toast("Note added"); }}
        />
      );
    },
  };

  return (
    <Ctx.Provider value={act}>
      {children}
      {modal}
    </Ctx.Provider>
  );
}

function ClientForm({ title, submitLabel = "Save", initial, onSubmit, onClose }) {
  return (
    <FormModal
      size="lg"
      title={title}
      submitLabel={submitLabel}
      initial={initial}
      onClose={onClose}
      onSubmit={onSubmit}
      fields={[
        { name: "name", label: "Client Name", required: true },
        { name: "type", label: "Client Type", type: "select", required: true, options: ["Individual", "Corporate"] },
        { name: "phone", label: "Phone", type: "tel" },
        { name: "email", label: "Email", type: "email", validate: emailOk },
        { name: "city", label: "City" },
        { name: "referredBy", label: "Referred By", placeholder: "Self" },
        { name: "address", label: "Address", type: "textarea", full: true },
        { name: "identity", label: "Identity Proof", full: true, placeholder: "e.g. Aadhar Card (XXXX-XXXX-1234)" },
      ]}
    />
  );
}

function MemberForm({ title, submitLabel = "Save", initial, onSubmit, onClose, members }) {
  return (
    <FormModal
      size="lg"
      title={title}
      submitLabel={submitLabel}
      initial={initial}
      onClose={onClose}
      onSubmit={onSubmit}
      fields={[
        { name: "name", label: "Full Name", required: true },
        { name: "title", label: "Job Title", placeholder: "e.g. Senior Advocate" },
        { name: "role", label: "Role", type: "select", required: true, options: roleOptions },
        { name: "department", label: "Department", options: ["Legal", "Operations", "Management", "Finance", "Client Relations", "Human Resources"] },
        { name: "email", label: "Email", type: "email", required: true, validate: emailOk },
        { name: "phone", label: "Phone", type: "tel" },
        { name: "status", label: "Status", type: "select", required: true, options: ["Active", "Inactive"] },
        { name: "joined", label: "Date of Joining", type: "date" },
        { name: "reportsTo", label: "Reporting To", full: true, options: members.map((m) => `${m.name} (${m.role})`) },
      ]}
    />
  );
}

function RolesModal({ roles, invites, onSave, onRevoke, onClose }) {
  const [draft, setDraft] = useState(roles);
  const flip = (role, perm) =>
    setDraft((d) => ({ ...d, [role]: d[role].includes(perm) ? d[role].filter((p) => p !== perm) : [...d[role], perm] }));

  return (
    <Modal
      size="lg"
      title="Role Management"
      subtitle="Choose what each role is allowed to do."
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="rounded-lg border border-line px-5 py-2.5 text-sm font-medium hover:bg-slate-50">Cancel</button>
          <button onClick={() => { onSave(draft); onClose(); }} className="rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">Save Permissions</button>
        </>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-slate-600">
              <th className="px-3 py-2.5 font-medium">Permission</th>
              {roleDefs.map((r) => <th key={r} className="px-3 py-2.5 text-center font-medium">{r}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {allPermissions.map((p) => (
              <tr key={p}>
                <td className="px-3 py-2.5">{p}</td>
                {roleDefs.map((r) => (
                  <td key={r} className="px-3 py-2.5 text-center">
                    <input type="checkbox" checked={draft[r]?.includes(p) ?? false} onChange={() => flip(r, p)} className="h-4 w-4 accent-brand" aria-label={`${r} can ${p}`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {invites.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-2 text-sm font-bold">Pending Invites</h3>
          <ul className="divide-y divide-line rounded-lg border border-line text-sm">
            {invites.map((i) => (
              <li key={i.id} className="flex items-center justify-between px-3 py-2.5">
                <span>{i.email} <span className="text-slate-500">({i.role})</span></span>
                <button onClick={() => onRevoke(i.id)} className="text-xs font-medium text-red-600">Revoke</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
}
