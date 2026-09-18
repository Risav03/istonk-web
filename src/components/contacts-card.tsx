"use client";

import { useState } from "react";

import { api, ApiError, type ContactRow } from "@/lib/api";

import { Avatar, Button, Panel, PanelHead } from "./ds";
import { Field, inputClass } from "./ui";

type Draft = {
  id?: number;
  name: string;
  phone: string;
  email: string;
};

const emptyDraft = (): Draft => ({ name: "", phone: "", email: "" });

export function ContactsCard({
  contacts,
  onChanged,
}: {
  contacts: ContactRow[];
  onChanged: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!draft) return;
    setBusy(true);
    setError(null);
    try {
      if (draft.id) {
        await api.updateContact(draft.id, {
          name: draft.name.trim(),
          phone: draft.phone.trim() || null,
          email: draft.email.trim() || null,
        });
      } else {
        await api.saveContact({
          name: draft.name.trim(),
          phone: draft.phone.trim() || undefined,
          email: draft.email.trim() || undefined,
        });
      }
      setDraft(null);
      await onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save that contact.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    setBusy(true);
    setError(null);
    try {
      await api.deleteContact(id);
      if (draft?.id === id) setDraft(null);
      await onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't remove that contact.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel className="flex flex-col">
      <PanelHead
        title="Contacts"
        sub="People you send stocks to. Numbers need a country code."
        action={
          <Button variant="outline" size="sm" onClick={() => setDraft(emptyDraft())}>
            Add
          </Button>
        }
      />

      <div className="flex flex-col">
        {contacts.length === 0 && !draft ? (
          <p
            className="border-t border-rule px-5 py-5"
            style={{ font: "var(--type-body-sm)", color: "var(--text-secondary)" }}
          >
            No contacts yet. Add a name and a number or email.
          </p>
        ) : null}

        {contacts.map((contact) =>
          draft?.id === contact.id ? null : (
            <div
              key={contact.id}
              className="flex items-center gap-3.5 border-t border-rule px-5 py-3.5"
            >
              <Avatar name={contact.name} size={34} />
              <div className="min-w-0 flex-1">
                <p className="truncate" style={{ font: "var(--type-label)" }}>
                  {contact.name}
                </p>
                <p
                  className="truncate"
                  style={{ font: "var(--type-legal)", color: "var(--text-tertiary)" }}
                >
                  {[contact.phone, contact.email].filter(Boolean).join(" · ") || "No number yet"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <RowAction
                  onClick={() =>
                    setDraft({
                      id: contact.id,
                      name: contact.name,
                      phone: contact.phone ?? "",
                      email: contact.email ?? "",
                    })
                  }
                >
                  Edit
                </RowAction>
                <RowAction tone="down" disabled={busy} onClick={() => void remove(contact.id)}>
                  Remove
                </RowAction>
              </div>
            </div>
          ),
        )}

        {draft ? (
          <div className="flex flex-col gap-3.5 border-t border-rule px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <span style={{ font: "var(--type-h3)" }}>
                {draft.id ? "Edit contact" : "New contact"}
              </span>
              <RowAction onClick={() => setDraft(null)}>Cancel</RowAction>
            </div>
            <Field label="Name">
              <input
                className={inputClass}
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                placeholder="Mom"
              />
            </Field>
            <Field label="Phone">
              <input
                className={inputClass}
                value={draft.phone}
                onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
                placeholder="+1 555 123 4567"
                inputMode="tel"
              />
            </Field>
            <Field label="Email">
              <input
                className={inputClass}
                value={draft.email}
                onChange={(event) => setDraft({ ...draft, email: event.target.value })}
                placeholder="mom@example.com"
                type="email"
              />
            </Field>
            {error ? (
              <p style={{ font: "var(--type-body-sm)", color: "var(--down)" }}>{error}</p>
            ) : null}
            <Button busy={busy} onClick={() => void save()}>
              Save contact
            </Button>
          </div>
        ) : error ? (
          <p
            className="border-t border-rule px-5 py-3"
            style={{ font: "var(--type-body-sm)", color: "var(--down)" }}
          >
            {error}
          </p>
        ) : null}
      </div>
    </Panel>
  );
}

/** Row-level verb. A word, not an icon — a list of icon buttons reads as noise. */
function RowAction({
  tone = "slate",
  disabled,
  onClick,
  children,
}: {
  tone?: "slate" | "down";
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="cursor-pointer border-0 bg-transparent p-0 disabled:cursor-default"
      style={{
        font: "var(--type-micro)",
        color: tone === "down" ? "var(--down)" : "var(--text-secondary)",
      }}
    >
      {children}
    </button>
  );
}
