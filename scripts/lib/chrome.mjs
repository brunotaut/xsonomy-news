// Shared site furniture.
//
// The footer appears on the home page, the digest catalogue and every digest
// issue. Those are built by three different code paths (a static template, a
// second static template, and issuepage.mjs), so keeping the markup here is what
// stops the three copies drifting apart.

export const LINKEDIN_URL = "https://www.linkedin.com/in/nazarbegen/";

// Google Analytics 4. The measurement ID is public — it ships in every page —
// so it lives here rather than in secrets. Set GA_MEASUREMENT_ID to override it,
// or to an empty string to build the site with no analytics at all.
export const GA_MEASUREMENT_ID =
  process.env.GA_MEASUREMENT_ID === undefined ? "G-WG7PSZKB78" : process.env.GA_MEASUREMENT_ID;

export const CONSENT_KEY = "uav360-consent";

// Google Analytics, gated on consent.
//
// Consent Mode v2 is what makes the banner mean something: analytics_storage is
// denied by default, so no analytics cookie is written until the visitor agrees.
// A banner shown after the cookies are already set is decoration, not consent.
// A previous "granted" is restored here, before gtag('config'), so a returning
// visitor is measured from the first pageview rather than the second.
export function analyticsTag(id = GA_MEASUREMENT_ID) {
  if (!id) return "";
  return `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied'
  });
  try {
    if (localStorage.getItem('${CONSENT_KEY}') === 'granted') {
      gtag('consent', 'update', { analytics_storage: 'granted' });
    }
  } catch (e) {}
  gtag('js', new Date());

  gtag('config', '${id}');
</script>`;
}

// The consent bar. Hidden once a choice is stored, so it asks once and not again.
// Pointless without analytics, so it disappears with them.
export function consentBanner(id = GA_MEASUREMENT_ID) {
  if (!id) return "";
  return `<div id="consent" class="consent" role="dialog" aria-label="Cookie consent" hidden>
    <p>We use Google Analytics to count visits. Nothing is stored until you agree.</p>
    <div class="consent-actions">
      <button type="button" id="consent-no">Decline</button>
      <button type="button" id="consent-yes">Accept</button>
    </div>
  </div>
  <script>
  (function () {
    var KEY = '${CONSENT_KEY}', el = document.getElementById('consent');
    if (!el) return;
    var stored = null;
    try { stored = localStorage.getItem(KEY); } catch (e) {}
    if (stored) return;                 // already answered — never ask twice
    el.hidden = false;
    function choose(value) {
      try { localStorage.setItem(KEY, value); } catch (e) {}
      if (value === 'granted' && typeof gtag === 'function') {
        gtag('consent', 'update', { analytics_storage: 'granted' });
      }
      el.hidden = true;
    }
    document.getElementById('consent-yes').addEventListener('click', function () { choose('granted'); });
    document.getElementById('consent-no').addEventListener('click', function () { choose('denied'); });
  })();
  </script>`;
}

export function siteFooter() {
  return `<footer class="site-foot">
    <div class="wrap">
      <p>UAV360 aggregates publicly published headlines with links back to the original publishers. All trademarks and copyright belong to their respective owners.</p>
      <p class="credit">Created by Nazar Begen, <a href="${LINKEDIN_URL}" target="_blank" rel="noopener">LinkedIn</a></p>
    </div>
  </footer>`;
}
