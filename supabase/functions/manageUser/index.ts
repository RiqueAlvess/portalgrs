
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
    console.log("manageUser function called");

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
        throw new Error("Permissão negada: apenas administradores podem gerenciar usuários");
      }
    }

    // Parse request body
    const requestData = await req.json();
    console.log("Request data:", JSON.stringify(requestData));
    
    const { action, userId, userData, empresas, telas } = requestData;

    if (!action) {
      throw new Error("Ação não especificada");
    }

    let result = null;

    // Execute action
    switch (action) {
      case "create":
        console.log("Creating user...");
        if (!userData || !userData.email || !userData.password) {
          throw new Error("Dados de usuário incompletos");
        }

        // Criar usuário
        const { data: createData, error: createError } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: userData.user_metadata || {},
        });

        if (createError) {
          console.error("Error creating user:", createError);
          throw new Error(`Erro ao criar usuário: ${createError.message}`);
        }

        if (!createData.user) {
          throw new Error("Erro ao criar usuário: usuário não criado");
        }

        console.log("User created successfully:", createData.user.id);

        // Atualizar perfil
        if (userData.user_metadata) {
          const { error: perfilError } = await supabase
            .from("perfis")
            .update({
              nome: userData.user_metadata.nome || userData.email,
              tipo_usuario: userData.user_metadata.tipo_usuario || "normal"
            })
            .eq("id", createData.user.id);

          if (perfilError) {
            console.error("Erro ao atualizar perfil:", perfilError);
          }
        }

        // Vincular empresas se fornecidas
        if (empresas && Array.isArray(empresas) && empresas.length > 0) {
          console.log("Linking companies to user...", empresas);
          for (const empresaId of empresas) {
            console.log(`Vinculando empresa ${empresaId} ao usuário ${createData.user.id}`);
            const { error: empresaError } = await supabase
              .from("usuario_empresas")
              .insert({
                usuario_id: createData.user.id,
                empresa_id: empresaId
              });

            if (empresaError) {
              console.error(`Erro ao vincular empresa ${empresaId}:`, empresaError);
            }
          }
        } else {
          console.log("No companies to link");
        }

        // Vincular telas se fornecidas
        if (telas && Array.isArray(telas) && telas.length > 0) {
          console.log("Linking screens to user...", telas.length);
          for (const tela of telas) {
            if (tela.permissao_leitura) {
              console.log(`Vinculando tela ${tela.id} ao usuário ${createData.user.id}`);
              const { error: telaError } = await supabase
                .from("acesso_telas")
                .insert({
                  usuario_id: createData.user.id,
                  tela_id: tela.id,
                  permissao_leitura: tela.permissao_leitura,
                  permissao_escrita: tela.permissao_escrita,
                  permissao_exclusao: tela.permissao_exclusao
                });

              if (telaError) {
                console.error(`Erro ao vincular tela ${tela.id}:`, telaError);
              }
            }
          }
        } else {
          console.log("No screens to link");
        }

        result = { success: true, user: createData.user };
        break;

      case "update":
        console.log("Updating user...");
        if (!userId) {
          throw new Error("ID do usuário não fornecido");
        }

        const updateData: any = {};
        
        // Atualizar email se fornecido
        if (userData.email) {
          updateData.email = userData.email;
        }
        
        // Atualizar senha se fornecida
        if (userData.password) {
          updateData.password = userData.password;
        }
        
        // Atualizar metadados se fornecidos
        if (userData.user_metadata) {
          updateData.user_metadata = userData.user_metadata;
        }
        
        // Atualizar usuário
        const { data: updateUserData, error: updateUserError } = await supabase.auth.admin.updateUserById(
          userId,
          updateData
        );

        if (updateUserError) {
          console.error("Error updating user:", updateUserError);
          throw new Error(`Erro ao atualizar usuário: ${updateUserError.message}`);
        }

        if (!updateUserData.user) {
          throw new Error("Erro ao atualizar usuário: usuário não encontrado");
        }

        console.log("User updated successfully:", updateUserData.user.id);

        // Atualizar perfil
        if (userData.user_metadata) {
          const { error: perfilError } = await supabase
            .from("perfis")
            .update({
              nome: userData.user_metadata.nome || userData.email,
              tipo_usuario: userData.user_metadata.tipo_usuario || "normal"
            })
            .eq("id", userId);

          if (perfilError) {
            console.error("Erro ao atualizar perfil:", perfilError);
          }
        }

        // Atualizar empresas vinculadas
        if (empresas) {
          console.log("Updating company links...");
          console.log("Empresas a serem vinculadas:", empresas);
          
          // Remover empresas existentes
          const { error: deleteEmpresasError } = await supabase
            .from("usuario_empresas")
            .delete()
            .eq("usuario_id", userId);

          if (deleteEmpresasError) {
            console.error("Erro ao remover empresas vinculadas:", deleteEmpresasError);
          }

          // Adicionar novas empresas
          if (Array.isArray(empresas) && empresas.length > 0) {
            for (const empresaId of empresas) {
              console.log(`Vinculando empresa ${empresaId} ao usuário ${userId}`);
              const { error: empresaError } = await supabase
                .from("usuario_empresas")
                .insert({
                  usuario_id: userId,
                  empresa_id: empresaId
                });

              if (empresaError) {
                console.error(`Erro ao vincular empresa ${empresaId}:`, empresaError);
              }
            }
          } else {
            console.log("No companies to link");
          }
        }

        // Atualizar telas vinculadas
        if (telas) {
          console.log("Updating screen links...");
          console.log("Telas a serem vinculadas:", telas.length);
          
          // Remover telas existentes
          const { error: deleteTelaError } = await supabase
            .from("acesso_telas")
            .delete()
            .eq("usuario_id", userId);

          if (deleteTelaError) {
            console.error("Erro ao remover telas vinculadas:", deleteTelaError);
          }

          // Adicionar novas telas
          if (Array.isArray(telas) && telas.length > 0) {
            for (const tela of telas) {
              if (tela.permissao_leitura) {
                console.log(`Vinculando tela ${tela.id} ao usuário ${userId}`);
                const { error: telaError } = await supabase
                  .from("acesso_telas")
                  .insert({
                    usuario_id: userId,
                    tela_id: tela.id,
                    permissao_leitura: tela.permissao_leitura,
                    permissao_escrita: tela.permissao_escrita,
                    permissao_exclusao: tela.permissao_exclusao
                  });

                if (telaError) {
                  console.error(`Erro ao vincular tela ${tela.id}:`, telaError);
                }
              }
            }
          } else {
            console.log("No screens to link");
          }
        }

        result = { success: true, user: updateUserData.user };
        break;

      case "delete":
        console.log("Deleting user...");
        if (!userId) {
          throw new Error("ID do usuário não fornecido");
        }

        // Excluir usuário
        const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

        if (deleteError) {
          console.error("Error deleting user:", deleteError);
          throw new Error(`Erro ao excluir usuário: ${deleteError.message}`);
        }

        console.log("User deleted successfully:", userId);
        result = { success: true };
        break;

      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }

    // Return result
    return new Response(
      JSON.stringify(result),
      {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in manageUser function:", error);
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
