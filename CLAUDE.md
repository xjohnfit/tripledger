# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

TripLedger: a ride-share driver's ledger. Drivers log trips (Uber/Lyft/direct; fare, tip, distance) and expenses (gas, maintenance, tolls, other), then see earnings, expenses and net per period.

This project deliberately uses a **Python/FastAPI backend**, not the default Express/Mongo stack from the global CLAUDE.md. Don't suggest migrating it.

- `backend/`: FastAPI + SQLModel on SQLite (`backend/tripledger.db`, created at startup), JWT auth via PyJWT, password hashing via pwdlib.
- `frontend/`: React 19 + TypeScript + Vite + Tailwind v4, routed with `react-router` v8 (import from `'react-router'`, not `react-router-dom`). `App.tsx` holds the routes and a `RequireAuth` guard; `AuthProvider` (`auth.tsx`) + `useAuth` (`authContext.ts`) hold the logged-in user; shared UI pieces are in `components/ui.tsx`, the sidebar shell in `components/Layout.tsx`. Pages live in `src/pages/`: Login, Dashboard, Trips (filters + limit/offset pagination), AddTrip and Expenses (weekly category totals + list + inline add form). Date/money formatting helpers are in `src/lib/format.ts`.
- **Gotcha:** if Tailwind classes silently do nothing in dev while `npm run build` is fine, the Vite dev server is serving stale CSS (it missed files/folders created after it started). Restart `npm run dev` and hard-refresh.

## Commands

Backend (run from `backend/`, using its `.venv`, Python 3.14):

```bash
source .venv/bin/activate
fastapi dev app/main.py              # dev server on http://127.0.0.1:8000, docs at /docs
pytest                               # all tests (pytest.ini sets pythonpath=. and testpaths=tests)
pytest tests/test_api.py::test_summary_net   # a single test
```

Type checking: `pyrightconfig.json` at the repo root sets Pylance/pyright to `standard` mode for `backend/` (overriding the user-level `strict` VS Code setting, which flags every un-annotated pytest fixture and PyJWT/SQLModel's partially-unknown types). Run `npx pyright` from the repo root.

There is no `requirements.txt`/`pyproject.toml` yet; dependencies live only in `.venv` (fastapi, sqlmodel, pwdlib, PyJWT, python-dotenv, pytest, httpx).

Frontend (run from `frontend/`):

```bash
npm run dev       # Vite on http://localhost:5173
npm run build     # tsc -b (TypeScript 7) then vite build
npm run lint      # oxlint (config in .oxlintrc.json), not eslint
```

No frontend test runner is set up.

## Backend architecture

- **Env:** `app/__init__.py` calls `load_dotenv()` on import, so `backend/.env` must define `SECRET_KEY` (read in `security.py`). If it's missing, token creation fails, and that includes the tests.
- **Models (`models.py`)** follow the SQLModel split per resource: `XBase` (shared fields + validation) → `X(table=True)` (adds `id`, `user_id`) → `XCreate` / `XRead` / `XUpdate`. Validation limits (e.g. `distance_mi` gt 0 le 1000) live on the `Field`s, so invalid input returns 422 automatically.
- **Dependencies (`deps.py`):** routes take `SessionDep` (one session per request) and `CurrentUser` (decodes the Bearer token → `User`, or 401). There's a duplicate `SessionDep` in `main.py`; use the one in `deps.py`.
- **Ownership / multi-tenancy:** every query filters on `user_id == user.id`. A lookup of another user's record returns **404, not 403**, so ids can't be probed. This is done with dependencies that read the path param: `OwnedTrip` (`routers/trips.py`) and `OwnedExpense` (`routers/expenses.py`), e.g. `def delete_trip(trip: OwnedTrip, session: SessionDep)`. Routes taking them never see an unchecked record. Keep this pattern for any new resource; dependency functions must not carry an `@router` decorator.
- **Computed fields:** `TripRead.total` (fare + tip) isn't stored; `to_read()` in `routers/trips.py` computes it. Return trips through `to_read`.
- **PATCH semantics:** `TripUpdate` makes all fields optional; the handler drops `None` values except `notes`, which is the only field that can be cleared with `null`.
- **Times:** `Trip.started_at` is a naive local wall-clock datetime (no timezone); `Expense.spent_on` is a date. Date-range filters convert `[start, end]` dates to `[start 00:00, end+1 00:00)`.
- **Summary (`routers/summary.py`):** defaults to the current Mon–Sun week, max 366-day range. Per-day earnings are grouped in Python; expense totals by category use SQL `GROUP BY`. Money is rounded to 2 decimals at the API boundary (values are floats, not Decimal).
- **Login** is OAuth2 form data (`username` = email), not JSON; register is JSON. Emails are lowercased and trimmed.
- **CORS** in `main.py` allows only `localhost:5173` / `127.0.0.1:5173`.
- **No migrations:** tables come from `SQLModel.metadata.create_all` at startup. Changing a table model means deleting `tripledger.db` locally (there's no Alembic).

### Tests

`tests/conftest.py` overrides `get_session` with an in-memory SQLite (`StaticPool`), fresh per test. The `login` fixture registers + logs in a user and returns auth headers; call it with different emails for multi-user tests (`login("alice@example.com")`).

## Frontend ↔ backend contract

- `frontend/src/types.ts` mirrors the Pydantic `Read` models by hand. **When a model in `models.py` changes, update `types.ts` too.**
- `frontend/src/api.ts` is the single fetch wrapper: base URL from `VITE_API_URL` (default `http://127.0.0.1:8000`; production plans `VITE_API_URL=/api` behind an Ingress), JWT in `localStorage` under `tripledger_token`, a global 401 handler (`setUnauthorizedHandler`, registered by `AuthProvider` so any 401 logs the user out), and FastAPI error bodies (string or 422 array) turned into an `ApiError` message.
- The API client doesn't cover `GET/PATCH /trips/{id}` yet.

## Other files

`design/` holds PNG exports of the five screens (login, dashboard, trips, add trip, expenses) from the Figma file "TripLedger screens" (`figma.com/design/g6y4sGSmMhx6spHVd7tx4P`, page "Screens"). Figma is the source of truth; `design/README.md` maps each PNG to its page in `src/pages/`.

`.github/instructions/postman-*.instructions.md` are Copilot rules for generating Postman pre-request/post-response scripts (they apply only to Postman script files, not to the app code).
