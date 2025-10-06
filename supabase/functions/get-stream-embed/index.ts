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
    const { eventId } = await req.json();
    console.log('Fetching embed code for event:', eventId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch event details
    const { data: event, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error || !event) {
      console.error('Event not found:', error);
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate embed code
    const embedCode = `
<div id="igot-live-stream-${eventId}" style="width: 100%; max-width: 1280px; aspect-ratio: 16/9;">
  <iframe 
    src="${req.headers.get('origin') || 'https://your-domain.lovable.app'}/embed/${eventId}"
    frameborder="0"
    allow="autoplay; fullscreen; picture-in-picture"
    allowfullscreen
    style="width: 100%; height: 100%;"
  ></iframe>
</div>
<script>
  // Auto-resize handler
  window.addEventListener('message', (e) => {
    if (e.data.type === 'resize' && e.data.eventId === '${eventId}') {
      const iframe = document.querySelector('#igot-live-stream-${eventId} iframe');
      if (iframe) iframe.style.height = e.data.height + 'px';
    }
  });
</script>`;

    const embedUrl = `${req.headers.get('origin') || 'https://your-domain.lovable.app'}/embed/${eventId}`;

    return new Response(
      JSON.stringify({
        embedCode: embedCode.trim(),
        embedUrl,
        event: {
          id: event.id,
          title: event.title,
          status: event.status,
          scheduledDate: event.scheduled_date
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating embed code:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});