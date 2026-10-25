# Upstream JSXGraph 1.15.0-dev runtime candidate

This bundle is built from upstream `jsxgraph/jsxgraph` commit
`a3867ae130323b1bdc182674b03ebbdeb3c8d8f5`, using its locked build dependencies.
The machine-readable provenance and artifact hashes are shipped in
`_extensions/jsxgraph/upstream-runtime.json`. No upstream source is patched.
The PR #2 wrapper is retained.

The upstream 22–24 October fixes preserve a bounding box requested while a
board is hidden and restore explicit units and origins when it is shown.
A real Chromium control using 1.14.1 loses the requested `[0,10,10,0]` view;
this build preserves it and restores unitX=40, unitY=20, origin=(50,250).

A truly hidden percentage-width board still has zero width until shown.
It has no drawable hidden image. View recovery and hidden-image capture are
separate capabilities; a blank PNG must not be described as useful context.

AC approved the pinned Git source for both CDN and offline delivery on 25 Oct.
The CDN defaults name the immutable built-artifact commit `5a1847cbcdd22b1f167f5bb9a901d47cb43e3a23` in
`aacchhee/jsxgraph-quarto`; the artifact carries the exact upstream source,
lockfile, build recipe, file hashes and licence texts. Offline installation
extracts those same files from that commit's checksum-verified Git archive.
Run `python scripts/build-upstream-runtime.py --check` with the recorded
Node version to rebuild and compare every shipped runtime and notice byte.
The GitHub workflow performs the same check. No source patches, tag,
publication or deployment are needed.
