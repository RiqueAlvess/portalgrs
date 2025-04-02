
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
    console.log("getUsers function called");

    // Create Supabase client with admin privileges
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

    // Verificar se o usuário é admin
    const isAdmin = user.user_metadata?.tipo_usuario === "admin";
    console.log("User admin status from metadata:", isAdmin);
    
    if (!isAdmin) {
      // Verificar na tabela de perfis como fallback
      const { data: perfilData, error: perfilError } = await supabase
        .from("perfis")
        .select("tipo_usuario")
        .eq("id", user.id)
        .single();

      console.log("Perfil data:", perfilData, "Perfil error:", perfilError);

      if (perfilError || perfilData?.tipo_usuario !== "admin") {
        throw new Error("Permissão negada: apenas administradores podem listar usuários");
      }
    }

    // Parse request body for any filters
    let filters = {};
    let page = 1;
    let perPage = 50;
    
    try {
      if (req.method === "POST") {
        const requestData = await req.json();
        filters = requestData.filters || {};
        page = requestData.page || 1;
        perPage = requestData.perPage || 50;
      }
    } catch (error) {
      console.log("No request body or invalid JSON, using default filters");
    }

    console.log(`Listing users... Page: ${page}, Per page: ${perPage}`);
    
    // Listar usuários
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers({
      page: page,
      perPage: perPage,
    });

    if (usersError) {
      console.error("Error listing users:", usersError);
      throw new Error(`Erro ao listar usuários: ${usersError.message}`);
    }

    const totalUsers = users.users.length;
    console.log("Successfully listed users, count:", totalUsers);

    // Verificar se todos os usuários têm vinculações
    let userDetailsWithRelations = [];
    
    for (const user of users.users) {
      console.log(`Processing user data for: ${user.email}`);
      
      // Buscar empresas vinculadas
      const { data: empresasVinculadas, error: empresasError } = await supabase
        .from("usuario_empresas")
        .select("empresa_id, empresa:empresa_id(id, nome, cnpj)")
        .eq("usuario_id", user.id);
      
      if (empresasError) {
        console.error(`Error fetching companies for user ${user.id}:`, empresasError);
      }

      // Buscar telas vinculadas
      const { data: telasVinculadas, error: telasError } = await supabase
        .from("acesso_telas")
        .select(`
          tela_id,
          permissao_leitura,
          permissao_escrita,
          permissao_exclusao,
          tela:tela_id(id, nome, codigo)
        `)
        .eq("usuario_id", user.id);
      
      if (telasError) {
        console.error(`Error fetching screens for user ${user.id}:`, telasError);
      }

      // Adicionar dados à resposta
      userDetailsWithRelations.push({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        is_confirmed: user.confirmed_at !== null,
        user_metadata: user.user_metadata,
        last_sign_in_at: user.last_sign_in_at,
        empresas: empresasVinculadas || [],
        telas: telasVinculadas || []
      });
    }

    console.log(`Successfully processed ${userDetailsWithRelations.length} users with their relations`);

    // Return users with their relations
    return new Response(
      JSON.stringify({
        success: true,
        users: userDetailsWithRelations,
        page: page,
        perPage: perPage,
        total: users.total || totalUsers
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
    console.error("Error in getUsers function:", error);
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
        status: error.message.includes("Permissão negada") ? 403 : 500,
      }
    );
  }
});
