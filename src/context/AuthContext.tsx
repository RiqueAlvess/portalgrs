
import React, { createContext, useContext, useState, useEffect } from "react";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
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

  // Buscar perfil do usuário
  const fetchPerfil = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("perfis")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Erro ao buscar perfil:", error);
        return;
      }

      if (data) {
        setPerfil({
          id: data.id,
          nome: data.nome,
          tipo_usuario: data.tipo_usuario as "admin" | "normal",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
    }
  };

  // Buscar empresas do usuário
  const fetchEmpresas = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("usuario_empresas")
        .select(`
          empresa_id,
          empresas:empresa_id(
            id,
            nome,
            cnpj
          )
        `)
        .eq("usuario_id", userId);

      if (error) {
        console.error("Erro ao buscar empresas:", error);
        return;
      }

      if (data && data.length > 0) {
        const empresasData = data.map(item => ({
          id: item.empresas.id,
          nome: item.empresas.nome,
          cnpj: item.empresas.cnpj
        }));
        
        setEmpresas(empresasData);
        
        // Se não houver empresa atual, definir a primeira como atual
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
        // Configurar listener para mudanças na autenticação
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, currentSession) => {
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            
            if (currentSession?.user) {
              // Usar setTimeout para evitar problemas de lock com Supabase
              setTimeout(() => {
                fetchPerfil(currentSession.user.id);
                fetchEmpresas(currentSession.user.id);
              }, 0);
            } else {
              setPerfil(null);
              setEmpresas([]);
              setEmpresaAtual(null);
            }
          }
        );
        
        // Verificar se já existe uma sessão
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          await fetchPerfil(currentSession.user.id);
          await fetchEmpresas(currentSession.user.id);
          
          // Verificar se há empresa atual no localStorage
          const storedEmpresa = localStorage.getItem("empresaAtual");
          if (storedEmpresa) {
            setEmpresaAtual(JSON.parse(storedEmpresa));
          }
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Erro de login:", error);
        toast.error(error.message || "Falha no login. Por favor, tente novamente.");
        return false;
      }

      if (data.user) {
        toast.success("Login realizado com sucesso");
        return true;
      }

      return false;
    } catch (error) {
      console.error("Erro de login:", error);
      toast.error("Falha no login. Por favor, tente novamente.");
      return false;
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
