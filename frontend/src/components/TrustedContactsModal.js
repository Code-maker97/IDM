import React, { useEffect, useState } from "react";
import { X, Users, Plus, Trash2, Loader2, Phone } from "lucide-react";
import { api } from "../lib/api";

export default function TrustedContactsModal({ onClose }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relation, setRelation] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await api.get("/contacts");
      setContacts(res.data.contacts || []);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!name || !phone) return;
    setSaving(true);
    try {
      await api.post("/contacts", { name, phone, relation: relation || null });
      setName(""); setPhone(""); setRelation("");
      await load();
    } catch (err) {
      alert("Could not add contact.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/contacts/${id}`);
      await load();
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" data-testid="contacts-modal">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-5 slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="font-heading font-bold text-sm">Trusted contacts</div>
              <div className="text-[10px] text-zinc-500">SOS alerts will be sent to these numbers</div>
            </div>
          </div>
          <button data-testid="close-contacts-btn" onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={add} className="border border-zinc-800 rounded-xl p-3 mb-4 space-y-2">
          <input
            data-testid="contact-name-input"
            value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
          />
          <input
            data-testid="contact-phone-input"
            value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone (e.g., +14155552671)"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-zinc-500"
          />
          <input
            data-testid="contact-relation-input"
            value={relation} onChange={(e) => setRelation(e.target.value)}
            placeholder="Relation (optional)"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
          />
          <button
            data-testid="add-contact-btn"
            type="submit" disabled={saving || !name || !phone}
            className="w-full bg-white text-black font-heading text-xs uppercase tracking-[0.2em] py-2.5 rounded-full disabled:opacity-40 hover:bg-zinc-200 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Add contact
          </button>
        </form>

        <div className="space-y-2">
          {loading && <div className="text-xs text-zinc-500">Loading…</div>}
          {!loading && contacts.length === 0 && (
            <div className="text-xs text-zinc-500">No contacts yet.</div>
          )}
          {contacts.map((c) => (
            <div key={c.contact_id} data-testid={`contact-row-${c.contact_id}`} className="flex items-center gap-3 border border-zinc-800 rounded-xl p-3">
              <Phone className="w-3.5 h-3.5 text-zinc-500" />
              <div className="flex-1">
                <div className="text-sm">{c.name}</div>
                <div className="text-[11px] text-zinc-500 font-mono">{c.phone}</div>
              </div>
              {c.relation && <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">{c.relation}</div>}
              <button
                data-testid={`delete-contact-${c.contact_id}`}
                onClick={() => remove(c.contact_id)}
                className="p-2 rounded-full hover:bg-red-900/40 text-zinc-500 hover:text-red-300"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
