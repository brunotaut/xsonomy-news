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

export function analyticsTag(id = GA_MEASUREMENT_ID) {
  if (!id) return "";
  return `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', '${id}');
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
