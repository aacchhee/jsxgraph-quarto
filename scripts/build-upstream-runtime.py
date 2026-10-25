#!/usr/bin/env python3
"""Reproduce the pinned upstream runtime; never execute an unpinned checkout."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import tarfile
import tempfile
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
EXTENSION = ROOT / '_extensions/jsxgraph'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    record = json.loads((EXTENSION / 'upstream-runtime.json').read_text())
    actual_node = subprocess.check_output(['node', '--version'], text=True).strip().removeprefix('v')
    if actual_node != record['node']:
        raise SystemExit('Use the recorded Node version: ' + record['node'])
    url = 'https://codeload.github.com/' + record['repository'] + '/tar.gz/' + record['commit']
    with tempfile.TemporaryDirectory(prefix='jsxgraph-upstream-') as temporary:
        root = Path(temporary)
        data = urllib.request.urlopen(url, timeout=120).read()
        if digest(data) != record['sourceArchiveSha256']:
            raise SystemExit('Upstream source archive SHA-256 mismatch')
        archive = root / 'source.tar.gz'; archive.write_bytes(data)
        with tarfile.open(archive) as source:
            source.extractall(root, filter='data')
        source = root / ('jsxgraph-' + record['commit'])
        if digest((source / 'package-lock.json').read_bytes()) != record['packageLockSha256']:
            raise SystemExit('Upstream package lock SHA-256 mismatch')
        for command in record['build']:
            subprocess.run(command.split(), cwd=source, check=True)
        # buildCore emits no project notice. Retain upstream's complete notice;
        # change only its display version to the source's actual development ID.
        notice = (source / 'COPYRIGHT').read_bytes().replace(b'JSXGraph 1.14.1', b'JSXGraph 1.15.0-dev', 1)
        files = {
            'resources/js/jsxgraphcore.js': notice + (source / 'distrib/jsxgraphcore.js').read_bytes(),
            'resources/css/jsxgraph.css': (source / 'distrib/jsxgraph.css').read_bytes(),
            **{'resources/upstream/' + name: (source / name).read_bytes()
               for name in ('LICENSE.MIT', 'LICENSE.LGPL', 'COPYRIGHT')},
        }
        if set(files) != set(record['files']):
            raise SystemExit('Unexpected runtime inventory')
        for name, data in files.items():
            if digest(data) != record['files'][name]:
                raise SystemExit('Rebuilt runtime differs from the reviewed hash: ' + name)
            target = EXTENSION / name
            if args.check:
                if target.read_bytes() != data:
                    raise SystemExit('Bundled runtime differs from upstream build: ' + name)
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(data)
    print('Pinned upstream source, lockfile, build, notices and all runtime hashes reproduce.')


if __name__ == '__main__':
    main()
