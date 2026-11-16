# StudySync deployment and reliability lab

This is a local portfolio lab. It does not prove production uptime or cloud experience.
The existing hosted Vercel/Render app is separate; these changes do not update it automatically.

## Start

Requirements: Docker Desktop running, Docker Compose v2, Python 3; Node 22 for unit tests.

```sh
python3 scripts/lab.py init
docker compose up -d --build --wait --wait-timeout 180
python3 scripts/lab.py smoke
python3 scripts/lab.py drill
```

Run `init` only once: it refuses to overwrite an existing `.env`.
Open http://localhost:8080 and register a local account.
There is no seeded demo account in this lab. AI provider credentials are intentionally absent;
provider calls are mocked in unit tests, and successful live AI responses are not verified.
The local API uses development cookie settings for HTTP. For public hosting use TLS,
production cookie settings, managed credentials, database authentication and backups.
Never expose this development Compose stack to the internet.

## Design

Browser → Nginx → Express API → MongoDB volume.
Prometheus scrapes token-protected internal metrics every five seconds.
Only the frontend and monitoring console bind host ports, both on loopback.
Containers have memory limits; the API runs as an unprivileged user.

`/api/health` tests process liveness. `/api/health/ready` pings MongoDB and returns
503 during dependency failure or shutdown. Probes bypass the user rate limiter.
On SIGTERM, the API stops accepting connections, drains requests and closes MongoDB.
The database volume survives container replacement. `docker compose down -v` destroys it;
do not use that command if you want to retain your lab data.

## Monitoring and target

Open http://localhost:9090/query. Useful dashboard queries:

- Availability: `up{job="studysync"}`
- Database: `studysync_database_ready`
- Request rate: `sum(rate(http_request_duration_seconds_count[5m]))`
- Error ratio: `sum(rate(http_request_duration_seconds_count{status=~"5.."}[5m])) / clamp_min(sum(rate(http_request_duration_seconds_count[5m])), 0.001)`
- p95 latency: `histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))`

Learning target: 99% successful API requests and p95 under 500 ms in a controlled lab.
These are proposed objectives, not measured achievements. Health checks are excluded
from request traffic. Error ratios do not measure availability when traffic is absent;
use the up/database alerts as well. Alerts are visible in Prometheus; external paging is
not configured. Request logs contain generated IDs, route templates, status and duration,
not passwords, tokens, payloads or query strings.

## Incident exercise

`python3 scripts/lab.py drill` creates synthetic data, stops only this project's MongoDB,
checks readiness fails while liveness remains available, restarts the DB, recreates the API,
and verifies the authenticated account survives. It always restarts MongoDB in a finally block.
This tests persistence/recovery, not disaster-recovery backups or zero downtime.

When alerted: check `docker compose ps`, `/api/health/ready`, then
`docker compose logs --tail=100 api mongo`. Restore the dependency; do not repeatedly
restart a healthy API to conceal a database outage. Record trigger, impact, detection,
recovery steps and measured duration in an incident note.

## Release and rollback

Build a versioned candidate, then deploy it:

```sh
RELEASE_TAG=v2 docker compose build api web
python3 scripts/release.py v2
```

The release command saves the running image IDs before replacement. Failed readiness
restores both previous images and exits nonzero. This is a single-instance lab deployment
with a brief interruption, not blue/green deployment. Database migrations are out of scope;
image rollback does not undo incompatible schema/data changes.

## CI

GitHub Actions runs backend/frontend lint, tests and coverage, frontend build, then an
independent container job with HTTP smoke checks and the failure exercise. The existing
Render hook waits for all jobs. The Blueprint disables Render auto-deploy. Existing dashboard settings must also be
disabled or configured to wait for CI; otherwise it can bypass that gate. A local workflow edit does not establish
that GitHub Actions ran or that the deploy hook exists.

## ACKO alignment and interview preparation

- Programming/testing: Python operations scripts, Node API, integration tests.
- Containers/delivery: repeatable Docker builds, CI quality gates, versioned rollback.
- Reliability: readiness vs liveness, request metrics, alerts, shutdown and recovery exercise.
- Developer experience: documented commands and repeatable local onboarding.
- Linux/networking: explain container processes, signals, DNS, ports, reverse proxies,
  HTTP cookies and how to debug each layer. Tools do not establish your personal fluency.
- AWS/GCP, Kubernetes and Terraform are additional learning areas, not implemented or claimed here.
- Review every new file and run the exercises yourself before describing personal ownership.

## References

- https://docs.docker.com/compose/how-tos/startup-order/
- https://prometheus.io/docs/practices/instrumentation/
- https://kubernetes.io/docs/concepts/workloads/pods/probes/

## Dependency scan limitation

Compatible updates removed all reported high and critical production dependency findings
on 16 November 2026. Moderate advisories remain in qs/Express and React Router 6.
The next remediation requires dependency overrides or a Router major-version migration
and separate regression testing. Development tooling also has outstanding advisories.
CI blocks high/critical production dependency advisories; this is not a security certification.

URL imports default to disabled; approved administrator-controlled HTTPS hosts can be
listed in SYLLABUS_URL_HOSTS. Redirects are blocked, responses capped at 1 MB and
fetches time out after five seconds. Use outbound network restrictions on public deployments.
