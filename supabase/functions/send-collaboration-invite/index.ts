import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface InviteRequest {
  inviteeEmail: string;
  itineraryId: string;
  itineraryName: string;
  inviterName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Authenticate the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const inviterId = claims.claims.sub as string;
    const inviterEmail = claims.claims.email as string;

    // Parse request body
    const { inviteeEmail, itineraryId, itineraryName, inviterName }: InviteRequest = await req.json();

    if (!inviteeEmail || !itineraryId || !itineraryName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: inviteeEmail, itineraryId, itineraryName" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if RESEND_API_KEY is configured
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured - invite stored but email not sent");
      return new Response(
        JSON.stringify({ 
          success: true, 
          emailSent: false, 
          message: "Collaborator added. Email sending not configured yet." 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the invitation link
    const appUrl = Deno.env.get("APP_URL") || "https://swam.app";
    const inviteLink = `${appUrl}/trip/${itineraryId}?invite=true`;

    // Send email via Resend
    const displayName = inviterName || inviterEmail?.split("@")[0] || "Someone";
    
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SWAM <onboarding@resend.dev>", // Use resend.dev for testing, replace with verified domain
        to: [inviteeEmail],
        subject: `${displayName} invited you to collaborate on "${itineraryName}"`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #0ea5e9; margin: 0;">🗺️ SWAM</h1>
              <p style="color: #666; margin-top: 5px;">Your Travel Companion</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); border-radius: 12px; padding: 30px; color: white; text-align: center; margin-bottom: 30px;">
              <h2 style="margin: 0 0 10px 0; font-size: 24px;">You're Invited! 🎉</h2>
              <p style="margin: 0; opacity: 0.9;">${displayName} wants to plan a trip with you</p>
            </div>
            
            <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <h3 style="margin: 0 0 10px 0; color: #0ea5e9;">📍 ${itineraryName}</h3>
              <p style="margin: 0; color: #666;">You've been invited to collaborate on this travel itinerary. Add your own experiences, suggest changes, and help plan the perfect trip together!</p>
            </div>
            
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                View Itinerary →
              </a>
            </div>
            
            <p style="color: #999; font-size: 14px; text-align: center;">
              If you don't have a SWAM account yet, you'll be prompted to create one when you click the link.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              This email was sent by SWAM. If you didn't expect this invitation, you can safely ignore it.
            </p>
          </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Resend API error:", errorData);
      return new Response(
        JSON.stringify({ 
          success: true, 
          emailSent: false, 
          message: "Collaborator added but email failed to send",
          error: errorData 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailResult = await emailResponse.json();
    console.log("Collaboration invite email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailSent: true, 
        message: `Invitation sent to ${inviteeEmail}` 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in send-collaboration-invite:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
