import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export type SupabaseConnectionStatus =
  | { state: "checking"; message: string }
  | { state: "connected"; message: string }
  | { state: "local"; message: string; reason: string };

export const supabaseEnv = {
  hasUrl: Boolean(supabaseUrl),
  hasAnonKey: Boolean(supabaseAnonKey)
};

export const isSupabaseConfigured = supabaseEnv.hasUrl && supabaseEnv.hasAnonKey;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    })
  : null;

function classifySupabaseFailure(error: unknown) {
  if (!error) return "unknown error";
  const details = error as { code?: string; message?: string; status?: number; name?: string };
  const message = String(details.message ?? error).toLowerCase();

  if (details.status === 401 || message.includes("invalid api key") || message.includes("jwt")) {
    return "invalid key";
  }
  if (details.code === "42P01" || message.includes("does not exist") || message.includes("schema cache")) {
    return "table missing";
  }
  if (details.code === "42501" || message.includes("permission denied") || message.includes("row-level security") || message.includes("rls")) {
    return "permission/RLS issue";
  }
  if (details.name === "TypeError" || message.includes("failed to fetch") || message.includes("network")) {
    return "network error";
  }
  return details.message ?? "unknown error";
}

export async function testSupabaseConnection(): Promise<SupabaseConnectionStatus> {
  if (!supabaseUrl || !supabaseAnonKey) {
    const missing = [
      !supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : "",
      !supabaseAnonKey ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : ""
    ].filter(Boolean);

    return {
      state: "local",
      message: "Mode lokal aktif",
      reason: `env missing: ${missing.join(", ")}`
    };
  }

  if (!supabase) {
    return {
      state: "local",
      message: "Mode lokal aktif",
      reason: "Supabase client could not be created"
    };
  }

  try {
    const { error } = await supabase.from("events").select("id").limit(1);
    if (error) {
      return {
        state: "local",
        message: "Mode lokal aktif",
        reason: classifySupabaseFailure(error)
      };
    }

    return {
      state: "connected",
      message: "Supabase connected"
    };
  } catch (error) {
    return {
      state: "local",
      message: "Mode lokal aktif",
      reason: classifySupabaseFailure(error)
    };
  }
}
