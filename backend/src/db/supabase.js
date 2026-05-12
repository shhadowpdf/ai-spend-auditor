import { createClient } from "@supabase/supabase-js";
import {ENV} from "../utils/ENV.js";

const supabaseUrl = ENV.SUPABASE_URL;
const supabaseKey =
  ENV.SUPABASE_SECRET_KEY ||
  ENV.SUPABASE_SERVICE_ROLE_KEY ||
  ENV.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials not configured. Audit persistence disabled.");
}

export const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;
