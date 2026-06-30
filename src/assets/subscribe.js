// Newsletter subscribe form -> Supabase `subscribers` table (public insert only).
// The publishable/anon key is safe to ship; RLS allows insert but NOT reading the list.

const SUPABASE_URL = "https://uobidcahmrmfdmfbrtkt.supabase.co";
const SUPABASE_KEY = "sb_publishable_tI_n94KZbvS0Ao3TnHEAcA_tIEnRV7y";

const form = document.getElementById("subscribe");
if (form) {
  const msg = document.getElementById("sub-msg");
  const emailEl = document.getElementById("sub-email");
  const nameEl = document.getElementById("sub-name");
  const btn = form.querySelector("button[type=submit]");

  const show = (text, kind) => { msg.textContent = text; msg.className = "sub-msg " + (kind || ""); };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = (emailEl.value || "").trim();
    const name = (nameEl.value || "").trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { show("Enter a valid email.", "err"); emailEl.focus(); return; }

    btn.disabled = true; show("Subscribing…", "");
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/subscribers`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ email, name: name || null, source: "news" }),
      });
      if (res.ok) {
        form.reset();
        show("You're subscribed ✓ — daily briefing on its way.", "ok");
      } else if (res.status === 409) {
        show("You're already subscribed ✓", "ok");
      } else {
        const t = await res.text().catch(() => "");
        show(/duplicate|unique|23505/i.test(t) ? "You're already subscribed ✓" : "Something went wrong — try again.", /duplicate|unique|23505/i.test(t) ? "ok" : "err");
      }
    } catch {
      show("Network error — try again.", "err");
    } finally {
      btn.disabled = false;
    }
  });
}
