
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { signal_type, sender_id, recipient_id, data } = await req.json();
    
    // Validation de base
    if (!signal_type || !sender_id || !recipient_id || !data) {
      throw new Error('Missing required fields');
    }
    
    // Créer un client Supabase avec le rôle de service pour accéder à la base de données
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
    
    // Vérifier que l'expéditeur et le destinataire existent
    const { data: senderData, error: senderError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', sender_id)
      .single();
      
    if (senderError || !senderData) {
      throw new Error('Sender not found');
    }
    
    const { data: recipientData, error: recipientError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', recipient_id)
      .single();
      
    if (recipientError || !recipientData) {
      throw new Error('Recipient not found');
    }
    
    // Enregistrer le signal dans la base de données (optionnel, pour le debug)
    const { error: signalError } = await supabaseAdmin
      .from('webrtc_signals')
      .insert({
        signal_type,
        sender_id,
        recipient_id,
        data,
        created_at: new Date().toISOString()
      });
      
    if (signalError) {
      console.error('Error saving signal to database:', signalError);
      // On continue même si l'enregistrement échoue, car c'est optionnel
    }
    
    // Transmettre le signal au destinataire via Supabase Realtime
    const channelName = `webrtc-signal-${recipient_id}`;
    const eventType = `signal-${signal_type}`;
    
    const broadcast = await supabaseAdmin
      .channel(channelName)
      .send({
        type: 'broadcast',
        event: eventType,
        payload: {
          sender_id,
          data
        }
      });
    
    if (!broadcast) {
      throw new Error('Failed to broadcast signal');
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: `Signal ${signal_type} sent to ${recipient_id}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: error.message || 'An error occurred'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});
