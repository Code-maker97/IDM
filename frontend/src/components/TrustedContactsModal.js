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
    } catch { alert("Could not add contact."); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    try { await api.delete(`/contacts/${id}`); await load(); } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 flex items-end sm:items-center justify-center p-4" data-testid="contacts-modal">
      <div className="w-full max-w-md bg-white border border-rule rounded-lg shadow-gov slide-up overflow-hidden max-h-[90vh]">
        <div className="h-1 bg-navy-700" />
        <div className="p-5 overflow-y-auto max-h-[calc(90vh-4px)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded bg-navy-50 border border-navy-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-navy-700" />
              </div>
              <div>
                <div className="font-heading font-bold text-sm">Trusted contacts</div>
                <div className="text-[10px] text-muted">SOS alerts will be sent to these numbers</div>
              </div>
            </div>
            <button data-testid="close-contacts-btn" onClick={onClose} className="p-2 rounded hover:bg-canvas">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={add} className="border border-rule rounded p-3 mb-4 space-y-2 bg-canvas">
            <div className="gov-label mb-1">Add contact</div>
            <input
              data-testid="contact-name-input"
              value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="gov-input"
            />
            <input
              data-testid="contact-phone-input"
              value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone (e.g., +919876543210)"
              className="gov-input font-mono"
            />
            <input
              data-testid="contact-relation-input"
              value={relation} onChange={(e) => setRelation(e.target.value)}
              placeholder="Relation (optional)"
              className="gov-input"
            />
            <button
              data-testid="add-contact-btn"
              type="submit" disabled={saving || !name || !phone}
              className="w-full bg-navy-700 hover:bg-navy-800 text-white font-semibold text-xs uppercase tracking-wider py-2.5 rounded disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Add contact
            </button>
          </form>

          <div className="space-y-2">
            {loading && <div className="text-xs text-muted">Loading…</div>}
            {!loading && contacts.length === 0 && (
              <div className="text-xs text-muted text-center py-4 border border-dashed border-rule rounded">
                No contacts yet. Add at least one to enable SOS SMS.
              </div>
            )}
            {contacts.map((c) => (
              <div key={c.contact_id} data-testid={`contact-row-${c.contact_id}`} className="flex items-center gap-3 border border-rule rounded p-2.5 bg-white">
                <Phone className="w-3.5 h-3.5 text-navy-700" />
                <div className="flex-1">
                  <div className="text-sm font-semibold">{c.name}</div>
                  <div className="text-[11px] text-muted font-mono">{c.phone}</div>
                </div>
                {c.relation && <div className="text-[10px] uppercase tracking-wider text-muted">{c.relation}</div>}
                <button
                  data-testid={`delete-contact-${c.contact_id}`}
                  onClick={() => remove(c.contact_id)}
                  className="p-2 rounded hover:bg-sos/10 text-muted hover:text-sos"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
