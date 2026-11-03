# Company funding research checkpoint 25 — 3 November 2026

## Scope

Reviewed 20 published European landscape identities from `safran-electronics-and-defense` through `silixcon`. The review checked broad dated financing/history searches, company and transaction-party publications, ownership continuity, public grant records and investor/acquirer disclosures. Candidate URLs and empty catalogue rows were not treated as verified facts.

## Confirmed imports

| Company | Confirmed event(s) | Treatment |
|---|---|---|
| Safran Vectronix | 2003 SAGEM acquisition, approximately CHF60m package | Secondary consideration for Leica Vectronix AG plus its US sales company; not primary proceeds |
| Samel-90 | 2021 workplace modernisation grant, BGN307,963.92 | Signed company-specific grant |
| Sapient Perception | 2026 pre-seed, EUR2m | Balnord and FORWARD.one explicitly co-led |
| ScoutDI | 2026 Beam Global acquisition agreement, USD24m base price | Announced, not closed; earn-outs excluded |
| SCR | 2024 Sener acquisition | Completed; consideration undisclosed |
| sees.ai | 2025 funding round, GBP3.65m | Three co-leads and WakeUp Capital recorded |
| senseFly | 2021 AgEagle acquisition, USD23m | Completed combined Swiss/US package; secondary consideration |
| Sensofusion | 2026 Series B, EUR45m; 2026 IPO, approximately EUR259m primary proceeds | Secondary IPO sale excluded; cornerstone roles are source-supported |
| Sensrad | 2023 private placement, SEK40m | Gapwaves subscribed for new shares and received 30% |
| SensusQ | 2024 ESTDEV grant, EUR178,191.70; 2026 Quantum Systems acquisition | Acquisition terms undisclosed; two generic historic investor links added without round attribution |
| Septentrio | 2025 Hexagon acquisition | Completed; consideration undisclosed |
| Shotling | 2026 pre-seed, EUR700k | Mixed equity plus EIFO match-loan; component split undisclosed |
| siliXcon | Two 2024 Czech R&D grants, approximately CZK8.759m and CZK8.618m | Sole participant; published-thousands amounts marked approximate |

## Reconciled holds and negative findings

- **Safran Electronics & Defense:** parent/group financings and Safran Corporate Ventures investments are not subsidiary financing.
- **Samel-90:** the October 2026 defence-capacity selection is not a final grant agreement.
- **SBG Systems:** no source-supported external financing event established; this is not evidence of zero private funding.
- **Schiebel:** a 2009 authorised capital increase and investor search did not establish a completed raise.
- **sees.ai:** earlier aggregator-listed seed, convertible and grant entries remain unimported without adequate primary award or transaction evidence; the GBP30m Future Flight figure is a programme/consortium budget, not company proceeds.
- **Senhive:** no attributable public financing event established in the bounded review.
- **Senop:** the announced EUR10m production-facility investment is company spending, not funding; the entity is a Millog/Patria subsidiary.
- **SensusQ:** third-party acquisition-price estimates were rejected because the acquirer and EstVCA say terms were undisclosed.
- **Sentiq Defence:** launch and partner materials disclose no capital contribution.
- **Shield Systems:** identity and products are public, but no attributable financing event was found.
- **ScoutDI:** the signed transaction was expected to close in November 2026 and remained recorded as announced at the checked date.

## Database controls

- Pre-import: **418 events**, **253 companies with events**, **789 round participations**, **614 investor profiles**.
- Production rollback rehearsal succeeded and restored the exact baseline.
- Atomic import and idempotent rerun succeeded.
- Post-import: **434 events**, **264 companies with events**, **816 round participations**, **636 investor profiles**.
- All 16 manifest events resolve to catalogue companies; 25 event sources and 27 round participations were verified.

## Principal sources

- [Sapient Perception — Balnord](https://www.balnord.vc/article/sapient-perception-emerges-from-stealth-with-eu2m-pre-seed-to-advance-physical-ai-sensors-for-mission-critical-unmanned-systems)
- [ScoutDI agreement — Beam Global SEC filing](https://www.sec.gov/Archives/edgar/data/1398805/000143774926032264/beem20261007_8k.htm)
- [SCR integration — Sener](https://www.group.sener/en/noticias/scr-celebra-30-anos-de-liderazgo-en-target-drones-y-su-reciente-integracion-en-el-grupo-sener/)
- [sees.ai funding announcement](https://www.sees.ai/2025/10/08/sees-ai-secures-3-65m-to-accelerate-world-first-centralised-autonomous-drone-operations-for-critical-national-infrastructure/)
- [senseFly closing — Parrot](https://www.globenewswire.com/news-release/2021/10/20/2317657/0/en/parrot-closing-of-the-sale-of-sensefly-to-ageagle-aerial-systems-inc.html)
- [Sensofusion IPO](https://investors.sensofusion.com/en/ipo)
- [Sensrad private placement — Gapwaves](https://news.cision.com/gapwaves-ab/r/gapwaves-makes-a-strategic-investment-into-the-radar-sensor-market-by-acquiring-a-minority-stake-in-%2Cc3759387)
- [SensusQ acquisition — Quantum Systems](https://quantum-systems.com/news/quantum-systems-expands-estonia/)
- [Septentrio acquisition — Hexagon](https://hexagon.com/about/news-media/press-releases/2025/hexagon-completes-acquisition-of-septentrio-expanding-the-reach-of-mission-critical-navigation-and-a)
- [Shotling pre-seed](https://via.ritzau.dk/pressemeddelelse/14776051/danish-c-uas-startup-shotling-raises-euro700k-oversubscribed-pre-seed-myriad-ipo-club-eifo-for-anti-drone-shotgun?lang=en&publisherId=90456)
- [siliXcon compact-drive grant — STARFOS](https://starfos.tacr.cz/en/projekty/FW10010420)
