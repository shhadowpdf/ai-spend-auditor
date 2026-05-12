import "dotenv/config";

export const ENV ={
    PORT: process.env.PORT,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    PUBLIC_URL: process.env.PUBLIC_URL,
}
