// Shared site furniture.
//
// The footer appears on the home page, the digest catalogue and every digest
// issue. Those are built by three different code paths (a static template, a
// second static template, and issuepage.mjs), so keeping the markup here is what
// stops the three copies drifting apart.

export const LINKEDIN_URL = "https://www.linkedin.com/in/nazarbegen/";

export function siteFooter() {
  return `<footer class="site-foot">
    <div class="wrap">
      <p>UAV360 aggregates publicly published headlines with links back to the original publishers. All trademarks and copyright belong to their respective owners.</p>
      <p class="credit">Created by Nazar Begen, <a href="${LINKEDIN_URL}" target="_blank" rel="noopener">LinkedIn</a></p>
    </div>
  </footer>`;
}
