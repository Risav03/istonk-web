"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";

import { api, ApiError, type ContactRow } from "@/lib/api";

import { Button, Card, CardHeader, Field, inputClass } from "./ui";

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
    <Card>
      <CardHeader
        title="Contacts"
        subtitle="People you send stocks to. Numbers need a country code."
        action={
          <Button
            variant="outline"
            className="h-8 px-3"
            onClick={() => setDraft(emptyDraft())}
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        }
      />

      <div className="flex flex-col">
        {contacts.length === 0 && !draft ? (
          <p className="border-t border-hairline px-5 py-4 text-[13px] text-muted">
            No contacts yet. Add a name and a number or email.
          </p>
        ) : null}

        {contacts.map((contact) =>
          draft?.id === contact.id ? null : (
            <div
              key={contact.id}
              className="flex items-start justify-between gap-3 border-t border-hairline px-5 py-3.5"
            >
              <div className="min-w-0">
                <p className="text-[14px] font-semibold">{contact.name}</p>
                {contact.phone ? (
                  <p className="font-mono text-[12.5px] text-muted">{contact.phone}</p>
                ) : null}
                {contact.email ? (
                  <p className="truncate text-[12.5px] text-muted">{contact.email}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-chip hover:text-foreground"
                  onClick={() =>
                    setDraft({
                      id: contact.id,
                      name: contact.name,
                      phone: contact.phone ?? "",
                      email: contact.email ?? "",
                    })
                  }
                  aria-label={`Edit ${contact.name}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-chip hover:text-danger"
                  onClick={() => void remove(contact.id)}
                  aria-label={`Remove ${contact.name}`}
                  disabled={busy}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ),
        )}

        {draft ? (
          <div className="flex flex-col gap-3 border-t border-hairline px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold">
                {draft.id ? "Edit contact" : "New contact"}
              </span>
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-chip"
                aria-label="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
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
            {error ? <p className="text-[13px] text-danger">{error}</p> : null}
            <Button busy={busy} onClick={() => void save()}>
              Save contact
            </Button>
          </div>
        ) : error ? (
          <p className="border-t border-hairline px-5 py-3 text-[13px] text-danger">{error}</p>
        ) : null}
      </div>
    </Card>
  );
}
