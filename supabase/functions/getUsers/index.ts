
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

    // List users
    console.log("Listing users...");
    const { data: listUsersData, error: listUsersError } = await supabase.auth.admin.listUsers();

    if (listUsersError) {
      console.error("Error listing users:", listUsersError);
      throw new Error(`Erro ao listar usuários: ${listUsersError.message}`);
    }

    console.log("Successfully listed users, count:", listUsersData.users.length);

    // Return users data
    return new Response(
      JSON.stringify({ 
        success: true, 
        users: listUsersData.users 
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
        error: error.message || "Erro interno do servidor",
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
