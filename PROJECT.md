# The Real League
A low-cost, responsive site showing La Liga without Real Madrid or FC Barcelona.

## What it does
- `public/index.html`: website, with provisional standings and original/alternative switch.
- `scripts/update.py`: calculates standings from football-data.org match results.
- `.github/workflows/update.yml`: scheduled daily data update.
- `public/data/standings.json`: placeholder until a real API run succeeds.
- `tests/test_update.py`: computation test.

## Setup
1. In this GitHub repository open Settings → Secrets and variables → Actions → New repository secret.
2. Name it `FOOTBALL_DATA_TOKEN` and paste your football-data.org API token. **Never commit or post the token publicly.**
3. Open Actions → Refresh La Liga standings → Run workflow. Check it succeeds and replaces preview JSON.
4. Create a free Cloudflare Pages site connected to this repo. Set framework to None, build output directory to `public`, and build command to `exit 0`.
5. Open the new .pages.dev URL and check that the table shows actual results.

## Editorial and legal
This is independent and unaffiliated with LaLiga. The real table here uses points/goal difference rather than official head-to-head tiebreak rules. Only finished matches are counted. Check the football data provider's commercial-data terms before running ads. Data attribution is included; club logos are intentionally omitted.
