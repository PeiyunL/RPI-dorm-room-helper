# Publish Checklist (RPI Dorm Room Helper)

## 1) Frontend environment
- Copy `frontend/.env.example` to `frontend/.env`.
- Set `VITE_PB_URL` to the production PocketBase URL.

## 2) Clean install
- In `frontend/`, run `npm ci`.
- Do not copy `node_modules` between operating systems.

## 3) Required checks
- Run `npm run build` in `frontend/` and confirm success.
- Run `npm run lint` in `frontend/` and review all errors/warnings.

## 4) Deployment
- Run `./deploy.sh` from repository root (or deploy via CI).
- Confirm Apache restart succeeds on target server.

## 5) Post-deploy smoke test
- Open homepage and verify no console/runtime errors.
- Login/register flow works.
- Map loads and dorm details render.
- Community features (posts/comments/likes) still function.

## 6) Repository hygiene
- Ensure `frontend/dist`, `frontend/.env`, and `backend/pb_data` are not tracked in git.
