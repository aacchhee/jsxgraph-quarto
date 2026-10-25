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

This is a built runtime candidate for the CTM runtime pin, not a release.
The default CDN range is not changed here: an exact artifact URL and the
umbrella's online/offline pin contract must be selected together. No tag,
publication or deployment is performed.
