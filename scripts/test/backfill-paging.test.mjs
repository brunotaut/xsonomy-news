// The evidence backfill must offer each candidate to the model AT MOST ONCE per
// run. It did not: an article that yields no usable evidence is never marked, so
// it stays in the candidate query, and the query always returns the first N
// candidates in the same order. The 2026-11-02 run with max_articles=600 paid
// for 600 analyses and wrote 215 articles because the stuck rows accumulated at
// the head of the ordering and crowded out the untried ones.
import test from "node:test";
import assert from "node:assert/strict";
import { candidateBatches } from "../analyze-backfill.mjs";

// A pool that behaves like the real candidate query: ordered, and a row only
// leaves once it has been written. `stuckEvery` rows never succeed.
function pool({ total, stuckEvery = 0 }) {
  const rows = Array.from({ length: total }, (_, i) => ({
    url: `https://example.test/${i}`,
    stuck: stuckEvery > 0 && i % stuckEvery === 0,
  }));
  const written = new Set();
  let offered = 0;
  return {
    fetchPage: async (n) => rows.filter((r) => !written.has(r.url)).slice(0, n),
    settle: (batch) => { for (const r of batch) { offered++; if (!r.stuck) written.add(r.url); } },
    get offered() { return offered; },
    get written() { return written.size; },
  };
}

async function run({ total, stuckEvery, max, batch = 25 }) {
  const p = pool({ total, stuckEvery });
  let processed = 0;
  const seen = [];
  for await (const rows of candidateBatches(p.fetchPage,
    { max, batch, processed: () => processed })) {
    processed += rows.length;
    seen.push(...rows.map((r) => r.url));
    p.settle(rows);
  }
  return { ...p, seen, processed };
}

test("no article is offered to the model twice in one run", async () => {
  const { seen } = await run({ total: 538, stuckEvery: 8, max: 600 });
  assert.equal(new Set(seen).size, seen.length, "an article was analysed more than once");
});

test("a stuck article does not crowd out the ones never tried", async () => {
  // 538 candidates, every 8th permanently stuck, cap 600. The whole pool must
  // be reached, not the 215 the old paging managed.
  const { seen, written, offered } = await run({ total: 538, stuckEvery: 8, max: 600 });
  assert.equal(seen.length, 538, `only ${seen.length} of 538 candidates were offered`);
  assert.equal(offered, 538);
  assert.equal(written, 538 - Math.ceil(538 / 8));
});

test("the cap still caps", async () => {
  const { processed } = await run({ total: 1000, stuckEvery: 8, max: 100 });
  assert.equal(processed, 100);
});

test("it terminates when every remaining candidate has been tried", async () => {
  // Every row is stuck, so nothing ever leaves the pool. Without the attempted
  // set this is an infinite loop bounded only by spending.
  const { seen, offered } = await run({ total: 40, stuckEvery: 1, max: 10_000 });
  assert.equal(offered, 40);
  assert.equal(new Set(seen).size, 40);
});

test("an exhausted pool ends the run", async () => {
  const { processed } = await run({ total: 7, stuckEvery: 0, max: 600 });
  assert.equal(processed, 7);
});
