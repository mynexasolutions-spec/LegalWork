"use client";

import { useState } from "react";
import { ChevronDown, Upload, X } from "lucide-react";
import Modal from "./Modal";

const base = "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand disabled:bg-slate-50 disabled:text-slate-500";

const optValue = (o) => (typeof o === "string" ? o : o.value);
const optLabel = (o) => (typeof o === "string" ? o : o.label);

function FileField({ field, value, onChange }) {
  const files = value ?? [];
  const add = (list) => onChange(field.multiple ? [...files, ...list] : list.slice(0, 1));
  return (
    <div>
      <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center text-sm text-slate-600 hover:bg-slate-100">
        <Upload size={22} className="text-slate-500" />
        <span className="font-medium">Click to choose {field.multiple ? "files" : "a file"}</span>
        {field.hint && <span className="text-xs text-slate-500">{field.hint}</span>}
        <input type="file" multiple={field.multiple} accept={field.accept} className="hidden" onChange={(e) => { add([...e.target.files]); e.target.value = ""; }} />
      </label>
      {files.length > 0 && (
        <ul className="mt-2 space-y-1">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-1.5 text-xs">
              <span className="truncate">{f.name} <span className="text-slate-400">({Math.max(1, Math.round(f.size / 1024))} KB)</span></span>
              <button type="button" onClick={() => onChange(files.filter((_, j) => j !== i))} aria-label={`Remove ${f.name}`}><X size={14} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// field: { name, label, type, options, required, placeholder, full, hint, disabled, visible(values), list }
export default function FormModal({ title, subtitle, fields, initial = {}, submitLabel = "Save", onSubmit, onClose, size = "md", children }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(fields.map((f) => [f.name, initial[f.name] ?? f.default ?? (f.type === "file" ? [] : "")]))
  );
  const [errors, setErrors] = useState({});

  const set = (name, v) => {
    setValues((s) => ({ ...s, [name]: v }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    for (const f of fields) {
      if (f.visible && !f.visible(values)) continue;
      const v = values[f.name];
      const empty = f.type === "file" ? !v?.length : !String(v ?? "").trim();
      if (f.required && empty) next[f.name] = `${f.label} is required`;
      else if (f.validate && !empty) {
        const msg = f.validate(v, values);
        if (msg) next[f.name] = msg;
      }
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    if (onSubmit(values) !== false) onClose();
  };

  return (
    <Modal
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      size={size}
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded-lg border border-line px-5 py-2.5 text-sm font-medium hover:bg-slate-50">Cancel</button>
          <button type="submit" form="form-modal" className="rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">{submitLabel}</button>
        </>
      }
    >
      <form id="form-modal" onSubmit={submit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((f, i) => {
          if (f.visible && !f.visible(values)) return null;
          const id = `f-${f.name}`;
          const common = { id, value: values[f.name] ?? "", disabled: f.disabled, placeholder: f.placeholder };
          return (
            <div key={f.name} className={f.full || f.type === "textarea" || f.type === "file" ? "sm:col-span-2" : ""}>
              <label htmlFor={id} className="mb-1 block text-xs font-medium text-slate-600">
                {f.label}{f.required && <span className="text-red-500"> *</span>}
              </label>
              {f.type === "textarea" ? (
                <textarea {...common} autoFocus={i === 0} rows={f.rows ?? 3} onChange={(e) => set(f.name, e.target.value)} className={`${base} h-auto resize-y py-2`} />
              ) : f.type === "select" ? (
                <span className="relative block">
                  <select {...common} onChange={(e) => set(f.name, e.target.value)} className={`${base} appearance-none pr-8`}>
                    {!f.required && <option value="">{f.placeholder ?? "Select..."}</option>}
                    {f.required && !values[f.name] && <option value="">{f.placeholder ?? "Select..."}</option>}
                    {f.options.map((o) => <option key={optValue(o)} value={optValue(o)}>{optLabel(o)}</option>)}
                  </select>
                  <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                </span>
              ) : f.type === "file" ? (
                <FileField field={f} value={values[f.name]} onChange={(v) => set(f.name, v)} />
              ) : (
                <>
                  <input {...common} autoFocus={i === 0} type={f.type ?? "text"} list={f.options ? `${id}-list` : undefined} onChange={(e) => set(f.name, e.target.value)} className={base} />
                  {f.options && <datalist id={`${id}-list`}>{f.options.map((o) => <option key={optValue(o)} value={optValue(o)} />)}</datalist>}
                </>
              )}
              {errors[f.name] && <p className="mt-1 text-xs text-red-600">{errors[f.name]}</p>}
              {f.hint && f.type !== "file" && !errors[f.name] && <p className="mt-1 text-xs text-slate-500">{f.hint}</p>}
            </div>
          );
        })}
        {children}
      </form>
    </Modal>
  );
}
