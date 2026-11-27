# Production hardening v9.5

## Acceptance

1. `npm run check` — syntax checks and all automated tests.
2. `npm run production:smoke` — isolated CLI integration, expected exit codes, tamper detection and regression verification.
3. `npm run production:pack` — inspect package inclusion before any release.
4. Run the declared GitHub Actions matrix on actual hosted Ubuntu, Windows and macOS runners with Node 20 and 22.

## Exit code contract (qualification CLI)

- `0`: verification succeeded or dataset qualified.
- `2`: invalid input, missing file or failed verification.
- `4`: audit completed but dataset not qualified.

## Evidence boundary

Local execution does not verify remote runners or actual editorial effectiveness. The package remains private; npm publication is out of scope. Near-duplicate screening and manual labels are not substitutes for independent real-world evaluation.
