import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function legacyHashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const derivedBits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, keyMaterial, 256);
  const hashArray = new Uint8Array(derivedBits);
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");
  const hashHex = Array.from(hashArray).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `pbkdf2:${saltHex}:${hashHex}`;
}

async function verifyPBKDF2Password(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(":");
  if (parts.length !== 3 || parts[0] !== "pbkdf2") return false;
  const saltHex = parts[1];
  const expectedHashHex = parts[2];
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const derivedBits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, keyMaterial, 256);
  const hashArray = new Uint8Array(derivedBits);
  const computedHashHex = Array.from(hashArray).map((b) => b.toString(16).padStart(2, "0")).join("");
  return computedHashHex === expectedHashHex;
}

function isPBKDF2Hash(hash: string): boolean { return hash.startsWith("pbkdf2:"); }
function isBcryptHash(hash: string): boolean { return /^\$2[aby]\$\d{2}\$/.test(hash); }

function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, "0")).join("");
}

// Race a promise against a timeout – returns null on timeout
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

async function persistSession(
  supabaseClient: any,
  email: string,
  sessionToken: string,
  sessionExpiry: Date,
): Promise<boolean> {
  try {
    const deleteResult = await withTimeout(
      supabaseClient.from("staff_sessions").delete().eq("email", email),
      3000,
    ) as any;

    if (!deleteResult || deleteResult.error) {
      console.error("Failed deleting existing session:", deleteResult?.error);
      return false;
    }

    const insertResult = await withTimeout(
      supabaseClient.from("staff_sessions").insert({
        email,
        session_token: sessionToken,
        expires_at: sessionExpiry.toISOString(),
      }),
      3000,
    ) as any;

    if (!insertResult || insertResult.error) {
      console.error("Failed inserting session:", insertResult?.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Session persistence error:", error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminPassword = Deno.env.get("ADMIN_PASSWORD");
    const adminEmailsRaw = Deno.env.get("ADMIN_EMAILS") || "";
    const shippingEmailsRaw = Deno.env.get("SHIPPING_EMAILS") || "";

    const adminEmails = adminEmailsRaw.split(",").map(e => e.trim().toLowerCase()).filter(e => e);
    const shippingEmails = shippingEmailsRaw.split(",").map(e => e.trim().toLowerCase()).filter(e => e);

    const { email, password } = await req.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // ── FAST PATH: check env credentials first so DB timeout doesn't block login ──
    let role: "admin" | "shipping" | null = null;
    if (adminEmails.includes(normalizedEmail)) role = "admin";
    else if (shippingEmails.includes(normalizedEmail)) role = "shipping";

    const envPasswordMatch = adminPassword ? password === adminPassword : false;

    // Try DB staff lookup with a 3-second timeout
    const dbStaff = await withTimeout(
      supabaseClient
        .from("staff_members")
        .select("id, email, role, password_hash, is_active")
        .eq("email", normalizedEmail)
        .maybeSingle()
        .then(r => r.data),
      3000
    );

    // ── DB staff found path ──
    if (dbStaff) {
      if (!dbStaff.is_active) {
        return new Response(JSON.stringify({ error: "Account is deactivated" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      let passwordValid = false;
      let needsRehash = false;

      if (dbStaff.password_hash === "env_based_no_password") {
        passwordValid = envPasswordMatch;
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
        return new Response(JSON.stringify({ error: "Invalid credentials" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Rehash in background – don't block response
      if (needsRehash) {
        hashPassword(password).then(pbkdf2Hash =>
          supabaseClient.from("staff_members").update({ password_hash: pbkdf2Hash }).eq("id", dbStaff.id)
        ).catch(e => console.error("Rehash failed:", e));
      }

      const sessionToken = generateSessionToken();
      const sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Persist session before returning to avoid token race conditions
      const sessionStored = await persistSession(supabaseClient, normalizedEmail, sessionToken, sessionExpiry);
      if (!sessionStored) {
        return new Response(JSON.stringify({ error: "Login failed. Please try again." }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Log activity in background (non-critical)
      void supabaseClient.from("activity_logs").insert({
        actor_email: normalizedEmail, actor_role: dbStaff.role, action_type: "login",
        action_details: { login_time: new Date().toISOString(), source: "database" },
      }).then(() => undefined).catch((e) => console.error("Activity log storage failed:", e));

      return new Response(JSON.stringify({
        success: true, message: "Login successful",
        session_token: sessionToken, session_expiry: sessionExpiry.getTime(),
        email: normalizedEmail, role: dbStaff.role,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── ENV fallback path (DB timed out or user not in DB) ──
    if (!role) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!envPasswordMatch) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const sessionToken = generateSessionToken();
    const sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Store session in background
    (async () => {
      try {
        await supabaseClient.from("staff_sessions").delete().eq("email", normalizedEmail);
        await supabaseClient.from("staff_sessions").insert({
          email: normalizedEmail, session_token: sessionToken, expires_at: sessionExpiry.toISOString(),
        });
        await supabaseClient.from("activity_logs").insert({
          actor_email: normalizedEmail, actor_role: role!, action_type: "login",
          action_details: { login_time: new Date().toISOString(), source: "environment" },
        });
      } catch (e) { console.error("Session/log storage failed:", e); }
    })();

    console.log(`${role.toUpperCase()} login successful (fast-path)`);

    return new Response(JSON.stringify({
      success: true, message: "Login successful",
      session_token: sessionToken, session_expiry: sessionExpiry.getTime(),
      email: normalizedEmail, role,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: unknown) {
    console.error("Error in verify-admin-password:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
