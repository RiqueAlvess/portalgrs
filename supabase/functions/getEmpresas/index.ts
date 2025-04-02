
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    console.log("getEmpresas function called");

    // Create Supabase client with admin privileges to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Autorização necessária");
    }

    console.log("Authorization header found, verifying token");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError) {
      console.error("Auth error:", authError);
      throw new Error("Usuário não autenticado");
    }
    
    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    console.log("User authenticated:", user.id);

    // Parse request body for any filters
    let filters = {};
    let page = 1;
    let perPage = 200;
    
    try {
      if (req.method === "POST") {
        const requestData = await req.json();
        filters = requestData.filters || {};
        page = requestData.page || 1;
        perPage = requestData.perPage || 200;
      }
    } catch (error) {
      console.log("No request body or invalid JSON, using default filters");
    }

    // Buscar todas as empresas sem aplicar RLS
    const { data: empresas, error: empresasError } = await supabase
      .from("empresas")
      .select("id, nome, cnpj, razao_social, nome_abreviado, endereco, cidade, uf")
      .order("nome", { ascending: true });

    if (empresasError) {
      console.error("Error fetching empresas:", empresasError);
      throw new Error(`Erro ao buscar empresas: ${empresasError.message}`);
    }

    console.log(`Successfully retrieved ${empresas?.length || 0} empresas`);

    // Return the empresas data
    return new Response(
      JSON.stringify({
        success: true,
        empresas: empresas || [],
      }),
      {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in getEmpresas function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Erro interno do servidor",
      }),
      {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        },
        status: error.message.includes("Autorização necessária") ? 401 : 500,
      }
    );
  }
});
