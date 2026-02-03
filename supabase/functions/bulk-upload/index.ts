import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Restrict CORS to known origins
const getAllowedOrigin = (requestOrigin: string | null): string => {
  const allowedOrigins = [
    'https://guiduuid.lovable.app',
    'https://id-preview--a388843f-3ad6-4de0-9fe7-5876ece9db30.lovable.app',
    'http://localhost:5173',
    'http://localhost:8080',
  ];
  
  if (requestOrigin && allowedOrigins.some(origin => requestOrigin.startsWith(origin.replace(/:\d+$/, '')))) {
    return requestOrigin;
  }
  
  return allowedOrigins[0]; // Default to production domain
};

interface ExperienceData {
  title: string;
  description?: string;
  location: string;
  price: number;
  category: string;
  creator: string;
  video_thumbnail?: string;
  duration_hours?: number;
  max_participants?: number;
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = {
    'Access-Control-Allow-Origin': getAllowedOrigin(origin),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Allow-Credentials': 'true',
  };

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase client using the anon key for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Create service role client for inserting data
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Check if user has admin or team_member role
    const { data: profile } = await supabaseService
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "team_member"].includes(profile.role)) {
      throw new Error("Insufficient permissions");
    }

    const { experiences } = await req.json();

    if (!Array.isArray(experiences)) {
      throw new Error("Experiences must be an array");
    }

    console.log(`Processing bulk upload of ${experiences.length} experiences`);

    const results = {
      successful: [] as string[],
      failed: [] as { experience: ExperienceData; error: string }[],
    };

    // Process each experience
    for (const experience of experiences) {
      try {
        // Validate required fields
        if (!experience.title || !experience.location || !experience.price || !experience.category || !experience.creator) {
          throw new Error("Missing required fields: title, location, price, category, creator");
        }

        // Insert experience
        const { data, error } = await supabaseService
          .from("experiences")
          .insert({
            title: experience.title,
            description: experience.description,
            location: experience.location,
            price: parseFloat(experience.price.toString()),
            category: experience.category,
            creator: experience.creator,
            video_thumbnail: experience.video_thumbnail,
            duration_hours: experience.duration_hours ? parseInt(experience.duration_hours.toString()) : null,
            max_participants: experience.max_participants ? parseInt(experience.max_participants.toString()) : null,
            created_by: user.id,
            status: 'active'
          })
          .select()
          .single();

        if (error) throw error;

        results.successful.push(data.id);
        console.log(`Successfully created experience: ${experience.title}`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error(`Failed to create experience ${experience.title}:`, errorMessage);
        results.failed.push({
          experience,
          error: errorMessage,
        });
      }
    }

    // Log the bulk upload
    await supabaseService
      .from("bulk_uploads")
      .insert({
        uploaded_by: user.id,
        file_name: "API Upload",
        total_records: experiences.length,
        successful_records: results.successful.length,
        failed_records: results.failed.length,
        status: "completed",
        errors: results.failed.map(f => f.error),
      });

    console.log(`Bulk upload completed: ${results.successful.length} successful, ${results.failed.length} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: experiences.length,
          successful: results.successful.length,
          failed: results.failed.length,
        },
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Error in bulk upload:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
