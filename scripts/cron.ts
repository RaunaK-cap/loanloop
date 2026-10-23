import { loadEnv } from "./lib";

loadEnv();

const base =
  process.env.APP_URL?.trim() ||
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  "http://localhost:3000";
const secret = process.env.CRON_SECRET?.trim();
const url = `${base.replace(/\/+$/, "")}/api/cron/overdue`;

const response = await fetch(url, {
  headers: secret ? { Authorization: `Bearer ${secret}` } : undefined,
});

const body = await response.text();
console.log(`${response.status} ${url}`);
console.log(body);

if (!response.ok) {
  process.exit(1);
}
