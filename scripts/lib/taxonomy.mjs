// Sector taxonomy: what counts as a leaf, which parents a company implies, and
// which rows are worth storing.
//
// The rule, in one line: store the most specific thing you can evidence, and let
// every parent above it be computed.
//
// This exists because the alternative went wrong in a way that was hard to see.
// A company classified as `cuas-det-radar` used to also carry a stored
// `cuas-detection` row. The parent row said nothing the leaf had not already
// said, but it was a row like any other, so anything that counted rows counted
// it as a capability. An audit that selected sectors with `slug LIKE 'cuas-%'`
// reported 111 unevidenced C-UAS capability assignments; the real figure was 10
// capabilities and 101 structural parents. The number was wrong because the
// storage model let a parent impersonate a capability.
//
// So: leaf-ness and ancestry are decided from the tree, never from the shape of
// a slug. `cuas-integrated` is a leaf that hangs directly off the root, and
// `cuas-detection` is a parent — no prefix rule gets both of those right.
//
// The database enforces the same invariant with triggers (see
// db/migrations/2026-10-26_cuas_derived_parent_taxonomy.sql), because writes
// arrive from this repo and from the catalogue repo. These helpers are the
// readable path; the triggers are the backstop.

/** Index a flat `sectors` read ({ id, slug, name, kind, parent_id }) for traversal. */
export function buildTaxonomy(sectors) {
  const byId = new Map(sectors.map((s) => [s.id, s]));
  const children = new Map();
  for (const s of sectors) {
    if (!s.parent_id) continue;
    const kids = children.get(s.parent_id) || [];
    kids.push(s.id);
    children.set(s.parent_id, kids);
  }

  const isLeaf = (id) => !(children.get(id) || []).length;

  /** Strict ancestors, nearest first. */
  const ancestorsOf = (id) => {
    const out = [];
    const seen = new Set([id]); // a malformed cycle should not hang the build
    let cur = byId.get(id)?.parent_id;
    while (cur && !seen.has(cur)) {
      out.push(cur);
      seen.add(cur);
      cur = byId.get(cur)?.parent_id;
    }
    return out;
  };

  /** Strict descendants, any depth. */
  const descendantsOf = (id) => {
    const out = [];
    const stack = [...(children.get(id) || [])];
    const seen = new Set();
    while (stack.length) {
      const next = stack.pop();
      if (seen.has(next)) continue;
      seen.add(next);
      out.push(next);
      stack.push(...(children.get(next) || []));
    }
    return out;
  };

  const inSubtree = (id, rootSlug) => {
    const root = sectors.find((s) => String(s.slug) === rootSlug);
    return !!root && (id === root.id || descendantsOf(root.id).includes(id));
  };

  return { byId, isLeaf, ancestorsOf, descendantsOf, inSubtree, childrenOf: (id) => children.get(id) || [] };
}

/**
 * Everything a company belongs to, explicit plus implied.
 *
 * Derived entries deliberately carry no evidence and no confidence. A parent is
 * an arithmetic consequence of a leaf, not a separately sourced claim, and
 * copying the leaf's URL onto it would manufacture evidence that nobody wrote.
 */
export function deriveEffectiveSectors(explicit, tax) {
  const held = new Set(explicit.map((e) => e.sectorId));
  const out = explicit.map((e) => ({ ...e, assignmentType: "explicit", derivedFrom: null }));

  const basis = new Map(); // ancestor id -> the explicit sectors that imply it
  for (const e of explicit) {
    for (const anc of tax.ancestorsOf(e.sectorId)) {
      if (held.has(anc)) continue; // asserted in its own right; keep it explicit
      const from = basis.get(anc) || [];
      from.push(e.sectorId);
      basis.set(anc, from);
    }
  }
  for (const [sectorId, derivedFrom] of basis) {
    out.push({ sectorId, assignmentType: "derived", sourceUrls: null, confidence: null, derivedFrom });
  }
  return out;
}

/** The specific capabilities under a domain — leaves only, decided structurally. */
export function specificCapabilities(explicit, tax, rootSlug = "counter-uas") {
  return explicit.filter((e) => tax.isLeaf(e.sectorId) && tax.inSubtree(e.sectorId, rootSlug));
}

/**
 * Should this assignment be written?
 *
 * An unevidenced parent of something the company already holds is skipped — it
 * is derivable, so storing it only creates a row that miscounts later. An
 * evidenced one is kept: somebody sourced that claim, and a storage convention
 * is not a reason to throw a citation away. That is also why a company whose
 * only evidence is broad ("NATO DIANA lists them for counter-UAS", no modality
 * stated) keeps its broad row instead of being forced into a leaf it cannot
 * support.
 *
 * Returns { store, reason, prune } — `prune` lists rows the new one makes
 * redundant, which is the mirror case: the parent was stored first and the leaf
 * arrived later.
 */
export function planAssignment({ sectorId, sourceUrls = [] }, heldRows, tax) {
  const held = heldRows.map((r) => r.sectorId);
  const hasEvidence = (sourceUrls || []).length > 0;
  const descendants = new Set(tax.descendantsOf(sectorId));

  if (!hasEvidence && held.some((h) => descendants.has(h))) {
    return { store: false, reason: "implied by a more specific sector already held", prune: [] };
  }

  const ancestors = new Set(tax.ancestorsOf(sectorId));
  const prune = heldRows
    .filter((r) => ancestors.has(r.sectorId))
    .filter((r) => !(r.sourceUrls || []).length) // never prune a sourced claim
    .filter((r) => !r.hasProducts)               // nor one with products hanging off it
    .map((r) => r.sectorId);

  return { store: true, reason: hasEvidence ? "evidenced assignment" : "specific assignment", prune };
}
