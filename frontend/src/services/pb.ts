import PocketBase from "pocketbase";

const pbUrl = (import.meta.env.VITE_PB_URL || "").trim();

if (!pbUrl) {
  throw new Error(
    "Missing VITE_PB_URL. Set it in frontend/.env (see frontend/.env.example)."
  );
}

const pb = new PocketBase(pbUrl);

export default pb;
