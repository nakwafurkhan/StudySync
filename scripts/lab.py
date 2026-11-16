#!/usr/bin/env python3
"""Local-only StudySync lab operations; no cloud credentials or paid resources."""
import argparse
import http.cookiejar
import json
import os
from pathlib import Path
import secrets
import subprocess
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
os.chdir(ROOT)
BASE = 'http://127.0.0.1:8080'
client = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))

def compose(*args):
    subprocess.run(['docker', 'compose', *args], check=True)

def request(path, data=None, method=None, expected=200):
    req = urllib.request.Request(BASE + path,
        data=None if data is None else json.dumps(data).encode(),
        headers={'Content-Type': 'application/json'}, method=method)
    try:
        response = client.open(req, timeout=10)
    except urllib.error.HTTPError as error:
        response = error
    body = response.read().decode()
    assert response.code == expected, f'{path}: expected {expected}, got {response.code}: {body[:200]}'
    return json.loads(body) if body.startswith('{') else body

def wait_ready(status=200, seconds=90):
    deadline = time.monotonic() + seconds
    while time.monotonic() < deadline:
        try:
            request('/api/health/ready', expected=status)
            return
        except (AssertionError, OSError):
            time.sleep(2)
    raise RuntimeError(f'Readiness did not reach {status}')

def smoke():
    wait_ready()
    assert '<html' in request('/').lower()
    request('/api/auth/me', expected=401)
    user = {'name': 'DevOps Smoke', 'email': f'lab-{secrets.token_hex(6)}@example.test',
            'password': secrets.token_urlsafe(24)}
    request('/api/auth/register', user, expected=201)
    request('/api/auth/me')
    subject = request('/api/subjects', {'name': 'Reliability', 'deadline': '2027-12-01', 'priority': 'high'}, expected=201)['subject']
    subject_id = subject['_id']
    request('/api/subjects/' + subject_id, {'name': 'Recovery'}, method='PUT')
    request('/api/sessions', {'subjectId': subject_id, 'durationMinutes': 25}, expected=201)
    request('/api/analytics/summary')
    request('/api/calendar')
    request('/api/subjects/' + subject_id, method='DELETE')
    request('/api/auth/logout', {})
    request('/api/auth/me', expected=401)
    request('/api/auth/login', {'email': user['email'], 'password': user['password']})
    request('/api/auth/me')
    print('PASS: web, readiness, auth, subject CRUD, session, analytics, calendar, logout/login')
    return user

def drill():
    user = smoke()
    started = time.monotonic()
    try:
        compose('stop', 'mongo')
        wait_ready(503)
        request('/api/health')
        print('PASS: database loss returns 503 readiness while process stays live')
    finally:
        compose('start', 'mongo')
    wait_ready()
    request('/api/auth/login', {'email': user['email'], 'password': user['password']})
    compose('up', '-d', '--force-recreate', '--no-deps', 'api')
    # Restart proxy so its upstream DNS resolves the recreated container.
    compose('restart', 'web')
    wait_ready()
    request('/api/auth/me')
    print(f'PASS: database and API recovered with user data/session retained ({time.monotonic()-started:.1f}s drill)')

def init():
    lab = ROOT / '.lab'
    lab.mkdir(exist_ok=True)
    env = ROOT / '.env'
    if env.exists():
        raise SystemExit('.env already exists; preserving it. Reuse it or move it yourself before init.')
    token = secrets.token_hex(32)
    env.write_text(f'JWT_SECRET={secrets.token_hex(32)}\nMETRICS_TOKEN={token}\n')
    env.chmod(0o600)
    (lab / 'metrics-token').write_text(token)
    # Prometheus runs as nobody inside its container; folder is local and ignored by Git.
    (lab / 'metrics-token').chmod(0o644)
    print('Created ignored local lab configuration. No secrets printed.')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['init', 'smoke', 'drill'])
    globals()[parser.parse_args().command]()
