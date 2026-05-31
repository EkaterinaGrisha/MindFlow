import { Router } from "express";
import crypto from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "./config";

const YANDEX_AUTHORIZE = "https://oauth.yandex.ru/authorize";
const YANDEX_TOKEN = "https://oauth.yandex.ru/token";
const YANDEX_INFO = "https://login.yandex.ru/info?format=json";

const STATE_TTL_MS = 10 * 60 * 1000;

type YandexInfo = {
  id: string;
  login?: string;
  display_name?: string;
  real_name?: string;
  default_email?: string;
};

function buildSyntheticEmail(yandexId: string): string {
  return `yandex_${yandexId}@auth.mindflow.local`;
}

function signState(secret: string, nonce: string, issuedAt: number): string {
  const payload = `${nonce}.${issuedAt}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex").slice(0, 32);
  return `${payload}.${sig}`;
}

function verifyState(secret: string, state: string): boolean {
  const parts = state.split(".");
  if (parts.length !== 3) return false;
  const [nonce, issuedAtStr, sig] = parts;
  const issuedAt = Number(issuedAtStr);
  if (!Number.isFinite(issuedAt)) return false;
  if (Date.now() - issuedAt > STATE_TTL_MS) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${nonce}.${issuedAtStr}`)
    .digest("hex")
    .slice(0, 32);
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

async function findUserByYandexId(
  admin: SupabaseClient,
  yandexId: string,
): Promise<string | null> {
  // listUsers paginates — для MVP перебираем первые несколько страниц.
  // На больших объёмах (>10k юзеров) лучше держать таблицу-маппинг yandex_id → user_id.
  for (let page = 1; page <= 5; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data) break;
    const found = data.users.find(
      (u) => (u.user_metadata as Record<string, unknown>)?.yandex_id === yandexId,
    );
    if (found) return found.id;
    if (data.users.length < 1000) break;
  }
  return null;
}

export function createYandexAuthRouter(): Router {
  const router = Router();
  const {
    yandexClientId,
    yandexClientSecret,
    yandexRedirectUri,
    supabaseUrl,
    supabaseServiceRoleKey,
    webAppOrigin,
  } = config.auth;

  if (
    !yandexClientId ||
    !yandexClientSecret ||
    !yandexRedirectUri ||
    !supabaseUrl ||
    !supabaseServiceRoleKey
  ) {
    console.warn(
      "[yandex-oauth] не настроены YANDEX_CLIENT_ID/SECRET/REDIRECT_URI или SUPABASE_URL/SERVICE_ROLE_KEY — Yandex OAuth отключён",
    );
    return router;
  }

  const stateSecret = supabaseServiceRoleKey;
  const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const frontOrigin = (webAppOrigin ?? "").split(",")[0]?.trim() || "http://localhost:5173";

  router.get("/api/auth/yandex/start", (_req, res) => {
    const nonce = crypto.randomBytes(16).toString("hex");
    const state = signState(stateSecret, nonce, Date.now());

    const url = new URL(YANDEX_AUTHORIZE);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", yandexClientId);
    url.searchParams.set("redirect_uri", yandexRedirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("force_confirm", "yes");

    res.redirect(url.toString());
  });

  router.get("/api/auth/yandex/callback", async (req, res, next) => {
    try {
      const { code, state, error: yandexError } = req.query as Record<string, string>;

      if (yandexError) {
        return res.redirect(
          `${frontOrigin}/login?oauth_error=${encodeURIComponent(yandexError)}`,
        );
      }
      if (!code || !state) {
        return res.redirect(`${frontOrigin}/login?oauth_error=missing_code`);
      }
      if (!verifyState(stateSecret, state)) {
        return res.redirect(`${frontOrigin}/login?oauth_error=bad_state`);
      }

      // 1. Exchange code → access token
      const tokenResp = await fetch(YANDEX_TOKEN, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          client_id: yandexClientId,
          client_secret: yandexClientSecret,
        }),
      });
      if (!tokenResp.ok) {
        return res.redirect(`${frontOrigin}/login?oauth_error=token_exchange_failed`);
      }
      const tokenJson = (await tokenResp.json()) as { access_token?: string };
      const accessToken = tokenJson.access_token;
      if (!accessToken) {
        return res.redirect(`${frontOrigin}/login?oauth_error=no_token`);
      }

      // 2. Get user info from Yandex
      const infoResp = await fetch(YANDEX_INFO, {
        headers: { Authorization: `OAuth ${accessToken}` },
      });
      if (!infoResp.ok) {
        return res.redirect(`${frontOrigin}/login?oauth_error=info_failed`);
      }
      const info = (await infoResp.json()) as YandexInfo;
      if (!info.id) {
        return res.redirect(`${frontOrigin}/login?oauth_error=no_user_id`);
      }

      // 3. Find or create Supabase user (by yandex_id in user_metadata)
      const syntheticEmail = buildSyntheticEmail(info.id);
      let userId = await findUserByYandexId(admin, info.id);

      if (!userId) {
        const { data: created, error: createError } = await admin.auth.admin.createUser({
          email: syntheticEmail,
          email_confirm: true,
          user_metadata: {
            yandex_id: info.id,
            oauth_provider: "yandex",
            nickname: info.display_name ?? info.login ?? null,
          },
        });
        if (createError || !created.user) {
          console.error("[yandex-oauth] createUser failed:", createError);
          return res.redirect(`${frontOrigin}/login?oauth_error=create_failed`);
        }
        userId = created.user.id;
      }

      // 4. Generate magic link → redirect user (Supabase Auth sets session)
      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email: syntheticEmail,
        options: { redirectTo: `${frontOrigin}/dashboard` },
      });
      if (linkError || !linkData.properties?.action_link) {
        console.error("[yandex-oauth] generateLink failed:", linkError);
        return res.redirect(`${frontOrigin}/login?oauth_error=link_failed`);
      }

      return res.redirect(linkData.properties.action_link);
    } catch (error) {
      next(error);
    }
  });

  console.log("[yandex-oauth] mounted on /api/auth/yandex/*");
  return router;
}
