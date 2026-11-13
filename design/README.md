# Design

PNG exports (1280×800) of the TripLedger screens. The source is the Figma file
[TripLedger screens](https://www.figma.com/design/g6y4sGSmMhx6spHVd7tx4P), made
alongside the build tutorial doc
([Build TripLedger: learn FastAPI with React and Tailwind](https://claude.ai/artifact/W9e6F6KduJuiQxUaywaBS4)).

| Screen    | File                           | Frontend page            |
| --------- | ------------------------------ | ------------------------ |
| Login     | [login.png](login.png)         | `src/pages/Login.tsx`    |
| Dashboard | [dashboard.png](dashboard.png) | `src/pages/Dashboard.tsx`|
| Trips     | [trips.png](trips.png)         | `src/pages/Trips.tsx`    |
| Add trip  | [add-trip.png](add-trip.png)   | `src/pages/AddTrip.tsx`  |
| Expenses  | [expenses.png](expenses.png)   | `src/pages/Expenses.tsx` |

Colors are Tailwind's slate and emerald; the font is Inter. Figma is the source
of truth: if a screen changes there, re-export it here.
