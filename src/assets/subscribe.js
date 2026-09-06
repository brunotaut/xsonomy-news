// Newsletter subscribe form -> Supabase `subscribers` table (public insert only).
// The publishable/anon key is safe to ship; RLS allows insert but NOT reading the list.

const SUPABASE_URL = "https://uobidcahmrmfdmfbrtkt.supabase.co";
const SUPABASE_KEY = "sb_publishable_tI_n94KZbvS0Ao3TnHEAcA_tIEnRV7y";

const form = document.getElementById("subscribe");
if (form) {
  const msg = document.getElementById("sub-msg");
  const emailEl = document.getElementById("sub-email");
  const nameEl = document.getElementById("sub-name");
  const freqEls = {
    daily: document.getElementById("sub-daily"),
    weekly: document.getElementById("sub-weekly"),
    monthly: document.getElementById("sub-monthly"),
  };
  const btn = form.querySelector("button[type=submit]");

  const show = (text, kind) => { msg.textContent = text; msg.className = "sub-msg " + (kind || ""); };

  const post = (body) => fetch(`${SUPABASE_URL}/rest/v1/subscribers`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
  });

  const isDuplicate = (status, text) => status === 409 || /duplicate|unique|23505/i.test(text || "");

  // Human wording for what they picked, so the confirmation reflects the choice.
  const describe = (picked) => {
    if (picked.length === 3) return "daily, weekly and monthly";
    if (picked.length === 2) return `${picked[0]} and ${picked[1]}`;
    return picked[0];
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = (emailEl.value || "").trim();
    const name = (nameEl.value || "").trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { show("Enter a valid email.", "err"); emailEl.focus(); return; }

    const prefs = {
      daily: !!(freqEls.daily && freqEls.daily.checked),
      weekly: !!(freqEls.weekly && freqEls.weekly.checked),
      monthly: !!(freqEls.monthly && freqEls.monthly.checked),
    };
    const picked = Object.keys(prefs).filter((k) => prefs[k]);
    if (!picked.length) {
      show("Pick at least one: daily, weekly or monthly.", "err");
      if (freqEls.daily) freqEls.daily.focus();
      return;
    }

    btn.disabled = true; show("Subscribing…", "");
    try {
      const row = { email, name: name || null, source: "news", ...prefs };
      let res = await post(row);

      // If the preference columns are not on the table yet, the insert is
      // rejected as a bad request. Fall back to the plain row rather than
      // failing the sign-up: the database defaults everyone to all three.
      if (!res.ok && res.status === 400) {
        const detail = await res.text().catch(() => "");
        if (/daily|weekly|monthly|column|PGRST204/i.test(detail)) {
          res = await post({ email, name: name || null, source: "news" });
        } else if (isDuplicate(res.status, detail)) {
          show("You're already subscribed ✓", "ok"); return;
        }
      }

      if (res.ok) {
        form.reset();
        show(`You're subscribed ✓ — ${describe(picked)}.`, "ok");
      } else {
        const t = await res.text().catch(() => "");
        if (isDuplicate(res.status, t)) show("You're already subscribed ✓", "ok");
        else show("Something went wrong — try again.", "err");
      }
    } catch {
      show("Network error — try again.", "err");
    } finally {
      btn.disabled = false;
    }
  });
}
