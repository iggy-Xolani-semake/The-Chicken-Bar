"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface StallOption {
  id: string;
  stall_type: string;
  price: number;
  total_available: number;
  spots_taken: number;
}

export default function BookAStallPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stallOptions, setStallOptions] = useState<StallOption[] | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    business_name: "",
    whatsapp_number: "",
    phone: "",
    email: "",
    business_category: "",
    products_services: "",
    preferred_event: "",
    number_of_stalls: 1,
    additional_info: "",
  });

  useEffect(() => {
    supabase
      .from("stall_settings")
      .select("id, stall_type, price, total_available, spots_taken")
      .eq("is_active", true)
      .then(({ data }) => setStallOptions((data as StallOption[]) ?? []));
  }, []);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim() || !form.whatsapp_number.trim()) {
      setError("Name and WhatsApp number are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: insertError } = await supabase.from("stall_bookings").insert(form);
    setSubmitting(false);
    if (insertError) {
      setError("Something went wrong. Please try again or contact us directly.");
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <h1 className="font-display text-bone text-4xl mb-4">Application Received</h1>
          <p className="font-body text-bone/70">
            We&apos;ll be in touch via WhatsApp or phone to confirm details.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-12 max-w-xl mx-auto">
      <h1 className="font-display text-bone text-4xl mb-8 text-center">Book a Stall</h1>

      {stallOptions !== null && stallOptions.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3 mb-10">
          {stallOptions.map((opt) => {
            const spotsLeft = opt.total_available - opt.spots_taken;
            return (
              <div key={opt.id} className="bg-smoke-light border border-bone/10 rounded-sm p-4">
                <p className="font-body font-bold text-bone uppercase text-sm">{opt.stall_type}</p>
                <p className="font-utility text-flame text-xl">R{opt.price}</p>
                <p className="font-body text-bone/50 text-xs mt-1">
                  {spotsLeft > 0
                    ? `Available: ${opt.spots_taken}/${opt.total_available}`
                    : "Fully booked"}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {error && <p className="text-ember text-sm mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Full Name" value={form.full_name} onChange={(v) => update("full_name", v)} required />
        <Input label="Business Name" value={form.business_name} onChange={(v) => update("business_name", v)} />
        <Input
          label="WhatsApp Number"
          value={form.whatsapp_number}
          onChange={(v) => update("whatsapp_number", v)}
          required
        />
        <Input label="Phone" value={form.phone} onChange={(v) => update("phone", v)} />
        <Input label="Email" value={form.email} onChange={(v) => update("email", v)} type="email" />
        <Input
          label="Business Category"
          value={form.business_category}
          onChange={(v) => update("business_category", v)}
        />
        <Textarea
          label="Products / Services"
          value={form.products_services}
          onChange={(v) => update("products_services", v)}
        />
        <Input
          label="Preferred Event"
          value={form.preferred_event}
          onChange={(v) => update("preferred_event", v)}
        />
        <Input
          label="Number of Stalls"
          value={String(form.number_of_stalls)}
          onChange={(v) => update("number_of_stalls", parseInt(v) || 1)}
          type="number"
        />
        <Textarea
          label="Additional Information"
          value={form.additional_info}
          onChange={(v) => update("additional_info", v)}
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full font-body font-bold uppercase tracking-wide bg-flame text-bone px-6 py-4 rounded-sm hover:bg-ember disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit Application"}
        </button>
      </form>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="block font-body text-sm text-bone/70 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-smoke border border-bone/20 rounded-sm px-4 py-3 text-bone"
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block font-body text-sm text-bone/70 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full bg-smoke border border-bone/20 rounded-sm px-4 py-3 text-bone"
      />
    </div>
  );
}
