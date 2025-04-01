
import React, { createContext, useContext, useState, useEffect } from "react";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  razao_social?: string;
  nome_abreviado?: string;
  endereco?: string;
  cidade?: string;
  uf?: string;
}

interface PerfilUsuario {
  id: string;
  nome: string;
  tipo_usuario: "admin" | "normal";
}

interface AuthContextType {
  user: User | null;
  perfil: PerfilUsuario | null;
  empresas: Empresa[];
  empresaAtual: Empresa | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  mudarEmpresa: (empresa: Empresa) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaAtual, setEmpresaAtual] = useState<Empresa | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Buscar perfil do usuário diretamente dos metadados do usuário autenticado
  const fetchPerfil = async (usuario: User) => {
    try {
      console.log("Buscando perfil para usuário:", usuario.email);
      
      // Extrair as informações diretamente dos metadados do usuário
      const userMetadata = usuario.user_metadata;
      
      if (userMetadata) {
        console.log("Metadados do usuário:", userMetadata);
        
        // Usar os dados dos metadados para definir o perfil
        setPerfil({
          id: usuario.id,
          nome: userMetadata.nome || userMetadata.full_name || usuario.email,
          tipo_usuario: userMetadata.tipo_usuario === "admin" ? "admin" : "normal",
        });
        
        // Log para depuração
        console.log(`Tipo de usuário detectado: ${userMetadata.tipo_usuario || 'normal'}`);
      } else {
        console.log("Nenhum metadado encontrado para este usuário");
        
        // Fallback: verificar na tabela de perfis
        const { data, error } = await supabase
          .from("perfis")
          .select("*")
          .eq("id", usuario.id)
          .single();

        if (error) {
          console.error("Erro ao buscar perfil:", error);
          return;
        }

        if (data) {
          console.log("Perfil encontrado na tabela:", data);
          setPerfil({
            id: data.id,
            nome: data.nome,
            tipo_usuario: data.tipo_usuario as "admin" | "normal",
          });
        } else {
          console.log("Nenhum perfil encontrado para este usuário");
        }
      }
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
    }
  };

  // Buscar empresas do usuário
  const fetchEmpresas = async (userId: string) => {
    try {
      console.log("Buscando empresas para userId:", userId);
      
      // Verificar se o usuário é admin pelo perfil
      const isAdmin = perfil?.tipo_usuario === 'admin';
      
      // Se não tiver perfil definido ainda, fazer uma verificação nos metadados
      if (!perfil && user) {
        const isAdminByMetadata = user.user_metadata.tipo_usuario === 'admin';
        console.log("Verificação admin via metadados:", isAdminByMetadata);
        
        if (isAdminByMetadata) {
          // Se for admin pelos metadados, buscar todas as empresas
          const { data, error } = await supabase
            .from("empresas")
            .select("id, nome, cnpj, razao_social, nome_abreviado, endereco, cidade, uf");
            
          if (error) {
            console.error("Erro ao buscar empresas:", error);
            return;
          }
          
          console.log("Empresas encontradas (admin via metadados):", data);
          setEmpresas(data || []);
          
          // Definir empresa atual se não estiver definida
          if (!empresaAtual && data && data.length > 0) {
            setEmpresaAtual(data[0]);
            localStorage.setItem("empresaAtual", JSON.stringify(data[0]));
          }
          return;
        }
      }
      
      // Se já tem perfil definido
      if (isAdmin) {
        // Se for admin, pega todas as empresas
        const { data, error } = await supabase
          .from("empresas")
          .select("id, nome, cnpj, razao_social, nome_abreviado, endereco, cidade, uf");
          
        if (error) {
          console.error("Erro ao buscar empresas:", error);
          return;
        }
        
        console.log("Empresas encontradas (admin):", data);
        setEmpresas(data || []);
        
        // Definir empresa atual se não estiver definida
        if (!empresaAtual && data && data.length > 0) {
          setEmpresaAtual(data[0]);
          localStorage.setItem("empresaAtual", JSON.stringify(data[0]));
        }
      } else {
        // Se for usuário normal, pega só as empresas vinculadas
        const { data, error } = await supabase
          .from("usuario_empresas")
          .select(`
            empresa_id,
            empresas:empresa_id(
              id,
              nome,
              cnpj,
              razao_social,
              nome_abreviado,
              endereco,
              cidade,
              uf
            )
          `)
          .eq("usuario_id", userId);
          
        if (error) {
          console.error("Erro ao buscar empresas vinculadas:", error);
          return;
        }
        
        // Transformar formato para usuários normais
        const empresasData = data?.map(item => ({
          id: item.empresas.id,
          nome: item.empresas.nome,
          cnpj: item.empresas.cnpj,
          razao_social: item.empresas.razao_social,
          nome_abreviado: item.empresas.nome_abreviado,
          endereco: item.empresas.endereco,
          cidade: item.empresas.cidade,
          uf: item.empresas.uf
        })) || [];
        
        console.log("Empresas encontradas (usuário normal):", empresasData);
        setEmpresas(empresasData);
        
        // Definir empresa atual se não estiver definida
        if (!empresaAtual && empresasData.length > 0) {
          setEmpresaAtual(empresasData[0]);
          localStorage.setItem("empresaAtual", JSON.stringify(empresasData[0]));
        }
      }
    } catch (error) {
      console.error("Erro ao buscar empresas:", error);
    }
  };

  // Efeito para carregar sessão do usuário
  useEffect(() => {
    // Verificar sessão existente no carregamento
    const loadSession = async () => {
      setIsLoading(true);
      
      try {
        console.log("Inicializando verificação de autenticação");
        
        // Configurar listener para mudanças na autenticação
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, currentSession) => {
            console.log("Evento de auth state change:", event);
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            
            if (currentSession?.user) {
              console.log("Usuário autenticado:", currentSession.user.email);
              console.log("Metadados:", currentSession.user.user_metadata);
              
              // Usar setTimeout para evitar problemas de lock com Supabase
              setTimeout(() => {
                fetchPerfil(currentSession.user);
              }, 0);
              
              // Buscar empresas depois de definir o perfil
              setTimeout(() => {
                fetchEmpresas(currentSession.user.id);
              }, 100);
            } else {
              console.log("Sem usuário autenticado");
              setPerfil(null);
              setEmpresas([]);
              setEmpresaAtual(null);
            }
          }
        );
        
        // Verificar se já existe uma sessão
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log("Sessão atual:", currentSession ? "Existe" : "Não existe");
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          // Imprimir dados do usuário para depuração
          console.log("Dados completos do usuário:", currentSession.user);
          console.log("Metadados do usuário:", currentSession.user.user_metadata);
          
          await fetchPerfil(currentSession.user);
          
          // Verificar se há empresa atual no localStorage
          const storedEmpresa = localStorage.getItem("empresaAtual");
          if (storedEmpresa) {
            setEmpresaAtual(JSON.parse(storedEmpresa));
          }
          
          // Buscar empresas depois do perfil
          await fetchEmpresas(currentSession.user.id);
        }
        
        // Adicionar cleanup para o subscription
        return () => {
          subscription?.unsubscribe();
        };
      } catch (error) {
        console.error("Erro ao carregar sessão:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Executar loadSession e capturar a função de limpeza
    const cleanup = loadSession();
    
    // Retornar função de limpeza para o useEffect
    return () => {
      // Usar uma IIFE async para chamar o cleanup de forma segura
      (async () => {
        if (cleanup) {
          try {
            // Esperar pela função de limpeza (se for uma Promise)
            await cleanup;
          } catch (error) {
            console.error("Erro no cleanup:", error);
          }
        }
      })();
    };
  }, []);

  // Login com Supabase
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      console.log(`Tentando login com email: ${email}`);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Erro de login:", error);
        
        // Mensagens de erro mais específicas
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Credenciais inválidas. Verifique seu email e senha.");
        } else {
          toast.error(error.message || "Falha no login. Por favor, tente novamente.");
        }
        
        throw error; // Lançar erro para ser capturado pelo componente Login
      }

      if (data.user) {
        console.log("Login bem-sucedido:", data.user.email);
        console.log("Metadados do usuário:", data.user.user_metadata);
        toast.success("Login realizado com sucesso");
        return true;
      }

      console.log("Login falhou mas não retornou erro");
      return false;
    } catch (error) {
      console.error("Erro de login:", error);
      // Não mostrar toast aqui, deixar o componente Login tratar o erro
      throw error; // Relançar o erro para o componente Login
    } finally {
      setIsLoading(false);
    }
  };

  // Logout com Supabase
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setPerfil(null);
      setEmpresas([]);
      setEmpresaAtual(null);
      localStorage.removeItem("empresaAtual");
      toast.info("Você foi desconectado");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast.error("Erro ao desconectar. Tente novamente.");
    }
  };

  // Mudar empresa atual
  const mudarEmpresa = (empresa: Empresa) => {
    setEmpresaAtual(empresa);
    localStorage.setItem("empresaAtual", JSON.stringify(empresa));
    toast.success(`Empresa alterada para: ${empresa.nome}`);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        perfil, 
        empresas, 
        empresaAtual, 
        isAuthenticated: !!user, 
        isLoading, 
        login, 
        logout, 
        mudarEmpresa 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
