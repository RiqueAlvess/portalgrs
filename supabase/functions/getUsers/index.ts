
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
    // Create Supabase client with admin privileges
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("As variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias");
    }

    // Verify authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Autorização necessária");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Usuário não autenticado");
    }

    // Verificar se o usuário é admin
    const isAdmin = user.user_metadata?.tipo_usuario === "admin";
    if (!isAdmin) {
      // Verificar na tabela de perfis como fallback
      const { data: perfilData, error: perfilError } = await supabase
        .from("perfis")
        .select("tipo_usuario")
        .eq("id", user.id)
        .single();

      if (perfilError || perfilData?.tipo_usuario !== "admin") {
        throw new Error("Permissão negada: apenas administradores podem listar usuários");
      }
    }

    // List users
    const { data: listUsersData, error: listUsersError } = await supabase.auth.admin.listUsers();

    if (listUsersError) {
      throw new Error(`Erro ao listar usuários: ${listUsersError.message}`);
    }

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
    console.error("Erro na função getUsers:", error);
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
