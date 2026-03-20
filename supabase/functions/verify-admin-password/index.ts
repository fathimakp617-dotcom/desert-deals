import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DB_TIMEOUT_MS = 3500;

async function withTimeout<T>(promise: Promise<T>, timeoutMs = DB_TIMEOUT_MS): Promise<T> {
  let timeoutId: number | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Database timeout")), timeoutMs) as unknown as number;
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

// Legacy SHA-256 hash for migration (will be replaced on next login)
async function legacyHashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Secure password hashing using PBKDF2 (Web Crypto API compatible)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  const hashArray = new Uint8Array(derivedBits);
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");
  const hashHex = Array.from(hashArray).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `pbkdf2:${saltHex}:${hashHex}`;
}

// Verify PBKDF2 password
async function verifyPBKDF2Password(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(":");
  if (parts.length !== 3 || parts[0] !== "pbkdf2") return false;

  const saltHex = parts[1];
  const expectedHashHex = parts[2];
  const salt = new Uint8Array(saltHex.match(/.{2}/g)?.map((byte) => parseInt(byte, 16)) || []);

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  const hashArray = new Uint8Array(derivedBits);
  const computedHashHex = Array.from(hashArray).map((b) => b.toString(16).padStart(2, "0")).join("");
  return computedHashHex === expectedHashHex;
}

function isPBKDF2Hash(hash: string): boolean {
  return hash.startsWith("pbkdf2:");
}

function isBcryptHash(hash: string): boolean {
  return /^\$2[aby]\$\d{2}\$/.test(hash);
}

function parseEmails(raw: string): string[] {
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function getRoleFromEmail(email: string, adminEmails: string[], shippingEmails: string[]): "admin" | "shipping" | null {
  if (adminEmails.includes(email)) return "admin";
  if (shippingEmails.includes(email)) return "shipping";
  return null;
}

async function createSessionRecord(supabaseClient: any, email: string, role: string) {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const sessionToken = Array.from(array).map((b) => b.toString(16).padStart(2, "0")).join("");
  const sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  try {
    await withTimeout(
      (async () => {
        if (role === "admin") {
          await supabaseClient
            .from("staff_sessions")
            .delete()
            .lt("expires_at", new Date().toISOString());

          const { data: activeSessions } = await supabaseClient
            .from("staff_sessions")
            .select("id, email, created_at")
            .neq("email", email)
            .order("created_at", { ascending: true });

          const { data: ownSessions } = await supabaseClient
            .from("staff_sessions")
            .select("id")
            .eq("email", email);

          const otherAdminSessions = activeSessions || [];
          const totalActive = otherAdminSessions.length + (ownSessions?.length || 0);

          if (totalActive >= 2 && (!ownSessions || ownSessions.length === 0)) {
            const oldestSession = otherAdminSessions[0];
            if (oldestSession?.id) {
              await supabaseClient
                .from("staff_sessions")
                .delete()
                .eq("id", oldestSession.id);
            }
          }
        }

        await supabaseClient
          .from("staff_sessions")
          .delete()
          .eq("email", email);

        await supabaseClient
          .from("staff_sessions")
          .insert({
            email,
            session_token: sessionToken,
            expires_at: sessionExpiry.toISOString(),
          });
      })(),
      DB_TIMEOUT_MS
    );
  } catch (error) {
    console.warn("Session persistence skipped due backend latency:", error);
  }

  return { sessionToken, sessionExpiry };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminPassword = Deno.env.get("ADMIN_PASSWORD");
    const adminEmails = parseEmails(Deno.env.get("ADMIN_EMAILS") || "");
    const shippingEmails = parseEmails(Deno.env.get("SHIPPING_EMAILS") || "");

    const { email, password } = await req.json();
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const envRole = getRoleFromEmail(normalizedEmail, adminEmails, shippingEmails);
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Fast path: env-based auth first to avoid admin login stalls during DB latency
    if (envRole && adminPassword && password === adminPassword) {
      const { sessionToken, sessionExpiry } = await createSessionRecord(supabaseClient, normalizedEmail, envRole);

      try {
        await withTimeout(
          supabaseClient.from("activity_logs").insert({
            actor_email: normalizedEmail,
            actor_role: envRole,
            action_type: "login",
            action_details: {
              login_time: new Date().toISOString(),
              session_expiry: sessionExpiry.toISOString(),
              source: "environment_fast_path",
            },
          }),
          DB_TIMEOUT_MS
        );
      } catch (logError) {
        console.warn("Activity log skipped:", logError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Login successful",
          session_token: sessionToken,
          session_expiry: sessionExpiry.getTime(),
          email: normalizedEmail,
          role: envRole,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // DB-backed staff auth path (bounded timeout)
    let dbStaff: any = null;
    try {
      const { data } = await withTimeout(
        supabaseClient
          .from("staff_members")
          .select("id, email, role, password_hash, is_active")
          .eq("email", normalizedEmail)
          .maybeSingle(),
        DB_TIMEOUT_MS
      );
      dbStaff = data;
    } catch (lookupError) {
      console.warn("DB staff lookup timed out, using env fallback only:", lookupError);
    }

    if (dbStaff) {
      if (!dbStaff.is_active) {
        return new Response(
          JSON.stringify({ error: "Account is deactivated" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let passwordValid = false;
      let needsRehash = false;

      if (dbStaff.password_hash === "env_based_no_password") {
        passwordValid = adminPassword ? password === adminPassword : false;
        needsRehash = passwordValid;
      } else if (isPBKDF2Hash(dbStaff.password_hash)) {
        passwordValid = await verifyPBKDF2Password(password, dbStaff.password_hash);
      } else if (isBcryptHash(dbStaff.password_hash)) {
        const legacyHash = await legacyHashPassword(password);
        passwordValid = legacyHash === dbStaff.password_hash;
        needsRehash = passwordValid;
      } else {
        const legacyHash = await legacyHashPassword(password);
        passwordValid = legacyHash === dbStaff.password_hash;
        needsRehash = passwordValid;
      }

      if (!passwordValid) {
        return new Response(
          JSON.stringify({ error: "Invalid credentials" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (needsRehash) {
        try {
          const pbkdf2Hash = await hashPassword(password);
          await withTimeout(
            supabaseClient
              .from("staff_members")
              .update({ password_hash: pbkdf2Hash })
              .eq("id", dbStaff.id),
            DB_TIMEOUT_MS
          );
        } catch (rehashError) {
          console.warn("Password rehash skipped:", rehashError);
        }
      }

      const { sessionToken, sessionExpiry } = await createSessionRecord(supabaseClient, normalizedEmail, dbStaff.role);

      try {
        await withTimeout(
          supabaseClient.from("activity_logs").insert({
            actor_email: normalizedEmail,
            actor_role: dbStaff.role,
            action_type: "login",
            action_details: {
              login_time: new Date().toISOString(),
              session_expiry: sessionExpiry.toISOString(),
              source: "database",
            },
          }),
          DB_TIMEOUT_MS
        );
      } catch (logError) {
        console.warn("Activity log skipped:", logError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Login successful",
          session_token: sessionToken,
          session_expiry: sessionExpiry.getTime(),
          email: normalizedEmail,
          role: dbStaff.role,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Final env fallback for non-DB users
    if (!adminPassword || !envRole || password !== adminPassword) {
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { sessionToken, sessionExpiry } = await createSessionRecord(supabaseClient, normalizedEmail, envRole);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Login successful",
        session_token: sessionToken,
        session_expiry: sessionExpiry.getTime(),
        email: normalizedEmail,
        role: envRole,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in verify-admin-password:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});