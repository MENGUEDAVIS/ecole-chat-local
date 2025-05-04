
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

  // Create Supabase client
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  try {
    // Créer le bucket pour les pièces jointes
    const { data: bucketData, error: bucketError } = await supabaseClient
      .storage
      .createBucket('attachments', {
        public: true, // Permettre l'accès public aux fichiers
        fileSizeLimit: 20971520, // 20MB
        allowedMimeTypes: [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'audio/mpeg',
          'audio/ogg',
          'audio/wav',
          'audio/webm',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]
      });

    if (bucketError) {
      throw bucketError;
    }

    // Configurer les politiques RLS pour le bucket
    const { error: policyError } = await supabaseClient
      .storage
      .from('attachments')
      .createSignedUploadUrl('test-policy');

    if (policyError && !policyError.message.includes('already exists')) {
      throw policyError;
    }

    return new Response(JSON.stringify({ 
      message: 'Bucket "attachments" created successfully', 
      bucket: bucketData 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    // Si le bucket existe déjà, ce n'est pas une erreur
    if (error.message && error.message.includes('already exists')) {
      return new Response(JSON.stringify({ 
        message: 'Bucket "attachments" already exists', 
        status: 'success' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    return new Response(JSON.stringify({ 
      error: error.message || 'An error occurred while creating the storage bucket' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
