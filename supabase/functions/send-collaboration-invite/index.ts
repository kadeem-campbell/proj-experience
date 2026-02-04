import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory rate limiter (resets on cold start, but provides basic protection)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 20; // Max 20 invites per hour per user
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in ms

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(userId);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count };
}

// Email validation regex (RFC 5322 simplified)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length === 0 || trimmed.length > 254) return false;
  return EMAIL_REGEX.test(trimmed);
}

function sanitizeString(str: string, maxLength: number): string {
  if (!str || typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength).replace(/[<>]/g, '');
}

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

    // Check rate limit
    const rateLimit = checkRateLimit(inviterId);
    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for user ${inviterId}`);
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded. Please try again later.",
          retryAfter: 3600 
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": "3600"
          } 
        }
      );
    }

    // Parse request body
    const body = await req.json();
    const inviteeEmail = body.inviteeEmail?.trim()?.toLowerCase();
    const itineraryId = body.itineraryId;
    const itineraryName = sanitizeString(body.itineraryName || "", 200);
    const inviterName = sanitizeString(body.inviterName || "", 100);

    // Validate required fields
    if (!inviteeEmail || !itineraryId || !itineraryName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: inviteeEmail, itineraryId, itineraryName" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    if (!isValidEmail(inviteeEmail)) {
      console.warn(`Invalid email format rejected: ${inviteeEmail}`);
      return new Response(
        JSON.stringify({ error: "Invalid email address format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate itinerary ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(itineraryId)) {
      return new Response(
        JSON.stringify({ error: "Invalid itinerary ID format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent self-invitation
    if (inviteeEmail === inviterEmail?.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: "You cannot invite yourself" }),
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
          message: "Collaborator added. Email sending not configured yet.",
          remaining: rateLimit.remaining
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the invitation link
    const appUrl = Deno.env.get("APP_URL") || "https://swam.app";
    const inviteLink = `${appUrl}/trip/${encodeURIComponent(itineraryId)}?invite=true`;

    // Send email via Resend
    const displayName = inviterName || inviterEmail?.split("@")[0] || "Someone";
    // Escape HTML in display name and itinerary name to prevent XSS
    const escapeHtml = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const safeDisplayName = escapeHtml(displayName);
    const safeItineraryName = escapeHtml(itineraryName);
    
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SWAM <onboarding@resend.dev>",
        to: [inviteeEmail],
        subject: `${safeDisplayName} invited you to collaborate on "${safeItineraryName}"`,
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
              <p style="margin: 0; opacity: 0.9;">${safeDisplayName} wants to plan a trip with you</p>
            </div>
            
            <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <h3 style="margin: 0 0 10px 0; color: #0ea5e9;">📍 ${safeItineraryName}</h3>
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
          error: errorData,
          remaining: rateLimit.remaining
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
        message: `Invitation sent to ${inviteeEmail}`,
        remaining: rateLimit.remaining
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
