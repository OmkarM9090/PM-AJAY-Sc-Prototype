"""Shared pytest setup.

Every test run gets its own throw-away SQLite file. That matters because the
telephony adapters derive a *stable* session id from the caller's number, so a
test that "calls" +91 98222 22222 would otherwise resume the interview left
behind by the previous run (a real feature — see RESUME_WINDOW in
routers/telephony.py — but poison for deterministic tests).

The env var must be set before ``database`` is imported, hence the module-level
code here rather than a fixture.
"""

import os
import sys
import tempfile

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

_TMP_DB = os.path.join(tempfile.mkdtemp(prefix="jeevikasetu-tests-"), "test.db")
os.environ.setdefault("JS_DATABASE_URL", f"sqlite:///{_TMP_DB}")
