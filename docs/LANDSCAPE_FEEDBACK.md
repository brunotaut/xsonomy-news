# Landscape feedback

Public form: https://xsonomy.com/landscape/feedback/ (catalogue repository).
Backend: Supabase Edge Function `landscape-feedback`, with source in this repository.

## Storage and privacy

`public.landscape_feedback` is a private inbox, separate from companies, research and subscribers. RLS is enabled and `anon` / `authenticated` have no table or RPC privileges. Only the backend service role can save or read submissions. Nothing is exported to the catalogue. Each record keeps the email, free-text message, creation time, exact accepted consent wording/version/time, review state and email-delivery state. No newsletter subscription is created.

The public endpoint requires an allowed website origin, a signed expiring challenge with a SHA-256 proof of work, an empty honeypot and explicit consent. It validates request size and text/email lengths on the server. Database insertion atomically limits submissions to 3 per email/hour, 20 per hashed connection/hour and 120 total/day. A repeated identical challenge returns the original reference; different content on a used challenge is rejected. The challenge is not IP-bound, so normal mobile network changes cannot invalidate it. Connection hashes still protect submission quotas and are cleared after two days by the mail worker; raw IPs are not stored in the inbox. These controls deter spam, not a claim that all automated abuse is impossible.

## Email delivery

`.github/workflows/landscape-feedback.yml` checks the durable queue every five minutes and can also run manually. GitHub may delay scheduled jobs. The existing `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `RESEND_API_KEY` secrets and `DIGEST_FROM` variable are consumed by the worker; no key is read out or copied into source. Existing digests and subscribers are untouched.

Every notification goes only to **brntaut@gmail.com**, with the submitter's email as Reply-To. Messages are sent as plain text, using the stored UUID as a Resend idempotency key. Rows are claimed with a lease and SKIP LOCKED; failed attempts retry with backoff, up to eight attempts. A submission is saved even if mail is unavailable. Success in the form means saved, not inbox delivery. No email address, message body or provider response body is printed to CI logs.

Resend idempotency keys last 24 hours. An ambiguous request left unconfirmed beyond that window requires checking the provider before replay, to avoid duplicates. Normal automatic retries complete inside this window.

Review in Supabase Table Editor or service-only SQL. Useful checks:

```sql
select notification_status, count(*)
from public.landscape_feedback group by notification_status;

select id, created_at, notification_attempts, notification_error
from public.landscape_feedback
where notification_status = 'failed';
```

After correcting delivery configuration and checking the provider, a specific failed row can be retried by setting its status to `pending`, attempts to 0 and next attempt to `now()`. Never bulk reset sent rows. Use `review_status` (`new`, `reviewed`, `closed`) for triage; consent withdrawal/deletion requests are handled by the owner at the contact address on the form.

## Verification

`node --test scripts/test/feedback.test.mjs` checks the migration in PGlite, anonymous read/write denial, consent rejection, quotas, idempotency, replay conflicts, delivery leases/retries, bad origins, forged/expired proof and fixed-recipient notifications. `node scripts/feedback-notifications.mjs --dry` makes no DB or email calls. The deployed function must be checked with a clearly marked synthetic submission, followed by owner email delivery verification.

Supabase advisors may report “RLS enabled, but no policies exist” for the inbox. This is intentional deny-by-default access for visitors: the service role has explicit privileges and bypasses RLS; anonymous/authenticated table and RPC grants are revoked. Do not add a public read/insert policy to silence that informational notice.
