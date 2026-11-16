#!/usr/bin/env python3
"""Deploy an existing local image tag and restore previous images on failed readiness."""
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
from lab import ROOT, compose, wait_ready

os.chdir(ROOT)
if len(sys.argv) != 2 or not re.fullmatch(r'[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}', sys.argv[1]):
    raise SystemExit('Usage: python3 scripts/release.py TAG (build both images with this tag first)')
tag = sys.argv[1]
previous = {}
for service in ('api', 'web'):
    cid = subprocess.check_output(['docker', 'compose', 'ps', '-q', service], text=True).strip()
    if not cid:
        raise SystemExit('Start a healthy lab before deploying a release.')
    previous[service] = subprocess.check_output(['docker', 'inspect', '--format', '{{.Image}}', cid], text=True).strip()
wait_ready()
for image in (f'studysync-api:{tag}', f'studysync-web:{tag}'):
    subprocess.run(['docker', 'image', 'inspect', image], check=True, stdout=subprocess.DEVNULL)
os.environ['RELEASE_TAG'] = tag
try:
    compose('up', '-d', '--no-build', '--no-deps', '--force-recreate', 'api', 'web')
    wait_ready(seconds=60)
    print(f'PASS: release {tag} is ready')
except (subprocess.CalledProcessError, RuntimeError):
    print('Release failed readiness; restoring exact previous image IDs.', flush=True)
    with tempfile.TemporaryDirectory() as temp:
        override = Path(temp) / 'rollback.json'
        override.write_text(json.dumps({'services': {s: {'image': image} for s, image in previous.items()}}))
        compose('-f', 'compose.yaml', '-f', str(override), 'up', '-d', '--no-build', '--no-deps', '--force-recreate', 'api', 'web')
    wait_ready()
    print('PASS: previous release restored; deployment failed as expected')
    sys.exit(1)
