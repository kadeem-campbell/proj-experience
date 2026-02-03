import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_ROLES = ['traveler', 'creator'];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Create Supabase client for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    // Parse request body
    const { role } = await req.json();

    // Validate role
    if (!role || !ALLOWED_ROLES.includes(role)) {
      throw new Error(`Invalid role. Allowed roles: ${ALLOWED_ROLES.join(', ')}`);
    }

    // Create service role client for updating data
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get current role for logging
    const { data: currentProfile, error: fetchError } = await supabaseService
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (fetchError) {
      throw new Error("Failed to fetch current profile");
    }

    const oldRole = currentProfile?.role;

    // Only update if role is actually changing
    if (oldRole === role) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Role unchanged",
          role 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Update the role using service role (bypasses RLS)
    const { error: updateError } = await supabaseService
      .from("profiles")
      .update({ role })
      .eq("id", user.id);

    if (updateError) {
      throw new Error("Failed to update role");
    }

    console.log(`Role changed for user ${user.id}: ${oldRole} -> ${role}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Role changed to ${role}`,
        role,
        previousRole: oldRole
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in change-role:", errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
