# Design release — 8 November 2026

Owner approval: owner explicitly requested “All clubs” and publication of the discussed site update on 8 November 2026. No new spending or services authorised.

Scope: retain original logo, cream/green/gold identity, existing calculations and source rights boundaries. Shorter introductions, current leagues before archive and editorial links, Usurper League / All clubs (Todos los clubes), visible data dates, and removal of the erroneous waiting notice after England results load. Journal links point to existing factual historical articles and methodology; no new recurring publication schedule has been launched.

Spanish homepage and Spain experience retained. English competition and English archive remain in English; Spanish entry links disclose this limitation. This release does not claim full Spanish localisation of England.

Validation: 32 Python tests and all existing Node test scripts passed. Browser QA confirmed EN/ES homepage switching, current England 14/20-club comparison, 1992/93 16/22-club comparison, and Spanish 18/20-club comparison. Original logo rendered correctly. Responsive CSS reviewed; separate narrow-viewport browser testing was not available in the browser API used.

Fixed existing history test harness to supply navigator.language and expect the existing Spanish legacy redirect, removing the observed blocker before scheduled Spain data refresh. Refresh success is verified separately after deployment; no fabricated dates or results.

Legal: existing attribution and independent/official distinction retained. Open data-licensing questions are unchanged by this design release. No tracking, ads, email collection, subscriptions or new dependencies.

Rollback: restore the changed presentation and test files from base commit bd1dc4ae47b410fcc23aedc7967c8ac9191a8b97 while preserving any newer data refresh commits.


## Contact update — 2026-11-08
Owner explicitly approved live contact link and requested invitations for improvements, error reports and general enquiries. Added mailto:hello@usurperleague.com on home, England and Spain landing pages; localized invitation in Spanish. Owner reported forwarding tested successfully. No new service, form, tracking or cost.
