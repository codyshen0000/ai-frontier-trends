/**
 * `npm run test:b2` globs scripts/b2/*.test.mjs.
 * Real cases live next to the modules; this file pulls them in.
 */
import "../engine/heat.test.mjs";
import "../engine/groupByEvent.test.mjs";
import "../engine/stubs.test.mjs";
import "../verify/b2-gates.test.mjs";
import "../redirects.test.mjs";
