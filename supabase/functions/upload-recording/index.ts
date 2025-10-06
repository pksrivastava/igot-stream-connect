import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { eventId, fileName, fileSize, duration } = await req.json();
    console.log('Uploading recording for event:', eventId);

    // Verify user is the organizer
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('id', eventId)
      .single();

    if (eventError || !event || event.organizer_id !== user.id) {
      throw new Error('Unauthorized - only organizer can upload recordings');
    }

    // Create recording entry
    const { data: recording, error: recordingError } = await supabase
      .from('event_recordings')
      .insert({
        event_id: eventId,
        file_path: fileName,
        file_size: fileSize,
        duration: duration,
        format: 'mp4'
      })
      .select()
      .single();

    if (recordingError) {
      console.error('Failed to create recording entry:', recordingError);
      throw recordingError;
    }

    // Update event status to completed
    await supabase
      .from('events')
      .update({ status: 'completed', recording_url: fileName })
      .eq('id', eventId);

    console.log('Recording uploaded successfully:', recording.id);

    return new Response(
      JSON.stringify({ success: true, recording }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error uploading recording:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});