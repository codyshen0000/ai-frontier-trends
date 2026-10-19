/** Entry so `node --test scripts/engine/` loads the suite (Node 22 treats a dir as a module). */
import "./loader.test.mjs";
import "./stubs.test.mjs";
import "./verify-registry.test.mjs";
