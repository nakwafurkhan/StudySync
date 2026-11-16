# Verification results

Date: 16 November 2026. Baseline commit: 99dd02f.
Tested locally on macOS with Docker Desktop Linux containers.

| Check | Observed result |
|---|---|
| Baseline suite | 100 backend + 54 frontend tests passed |
| Updated suite | 103 backend + 54 frontend tests passed |
| Backend line coverage | 92.46% |
| Frontend line coverage | 88.47% |
| Lint and frontend production build | Passed |
| Docker builds and startup | API, MongoDB, Nginx and Prometheus running; application health checks passed |
| HTTP smoke test | Registration/login/logout, subject create/read/update/delete, sessions, analytics, calendar passed |
| Browser | Registered a synthetic account, reached dashboard, created a subject and confirmed it persisted after reload |
| MongoDB failure drill | Readiness changed to 503, liveness remained 200; restored DB and replaced API, then verified session and account persisted |
| Measured recovery exercise | 21.2 seconds for the whole local drill, not a production recovery SLA |
| Rollback | Deliberately failing API image rejected; exact prior image IDs restored; post-rollback smoke test passed |
| Monitoring | promtool validated config and both alert rules; live Prometheus query returned database readiness 1 |
| Production dependency audit | Zero high/critical after compatible updates; two moderate findings in each package audit remain |

The first browser registration attempt coincided with a container rebuild; it passed after
reloading once the rebuild finished. A date-input automation attempt did not commit the
React field value; using keyboard input committed it and the form then saved correctly.

These checks are not proof every edge case works. Live AI calls, PDF uploads via browser,
external alert delivery, backup restoration, cloud deployments and Kubernetes/Terraform
are not verified. The hosted demo was not changed. FinanceFlow was not re-audited.
See DEVOPS.md for how to repeat the local checks and remaining security work.
