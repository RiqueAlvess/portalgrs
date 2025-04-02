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

  const fetchPerfil = async (usuario: User) => {
    try {
      console.log("Buscando perfil para usuário:", usuario.email);
      
      const userMetadata = usuario.user_metadata;
      
      if (userMetadata) {
        console.log("Metadados do usuário:", userMetadata);
        
        setPerfil({
          id: usuario.id,
          nome: userMetadata.nome || userMetadata.full_name || usuario.email,
          tipo_usuario: userMetadata.tipo_usuario === "admin" ? "admin" : "normal",
        });
        
        console.log(`Tipo de usuário detectado: ${userMetadata.tipo_usuario || 'normal'}`);
      } else {
        console.log("Nenhum metadado encontrado para este usuário");
        
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

  const fetchEmpresas = async (userId: string) => {
    try {
      console.log("Buscando empresas para userId:", userId);
      
      const isAdmin = perfil?.tipo_usuario === 'admin';
      const isAdminByMetadata = user?.user_metadata?.tipo_usuario === 'admin';
      
      console.log("Status admin:", { 
        viaMetadata: isAdminByMetadata, 
        viaPerfil: isAdmin 
      });
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        
        if (!token) {
          throw new Error("Sem token de autenticação");
        }
        
        const { data: empresasData, error: empresasError } = await supabase.functions.invoke('getEmpresas', {
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: {
            page: 1,
            perPage: 500
          }
        });
        
        if (empresasError) {
          console.error("Erro na resposta da Edge Function:", empresasError);
          throw empresasError;
        }
        
        if (empresasData && empresasData.success && Array.isArray(empresasData.empresas)) {
          console.log(`Empresas carregadas via Edge Function: ${empresasData.empresas.length}`);
          setEmpresas(empresasData.empresas);
          
          if (!empresaAtual && empresasData.empresas.length > 0) {
            setEmpresaAtual(empresasData.empresas[0]);
            localStorage.setItem("empresaAtual", JSON.stringify(empresasData.empresas[0]));
          }
          
          return;
        } else {
          console.error("Formato de resposta inválido:", empresasData);
          throw new Error("Formato de resposta inválido");
        }
      } catch (edgeFunctionError) {
        console.error("Erro ao buscar empresas via Edge Function:", edgeFunctionError);
        toast.error("Erro ao carregar empresas. Verifique os logs para mais detalhes.");
      }
    } catch (error) {
      console.error("Erro ao buscar empresas:", error);
      toast.error("Não foi possível carregar as empresas. Por favor, tente novamente mais tarde.");
    }
  };

  useEffect(() => {
    const loadSession = async () => {
      setIsLoading(true);
      
      try {
        console.log("Inicializando verificação de autenticação");
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, currentSession) => {
            console.log("Evento de auth state change:", event);
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            
            if (currentSession?.user) {
              console.log("Usuário autenticado:", currentSession.user.email);
              console.log("Metadados:", currentSession.user.user_metadata);
              
              setTimeout(() => {
                fetchPerfil(currentSession.user);
              }, 0);
              
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
        
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log("Sessão atual:", currentSession ? "Existe" : "Não existe");
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          console.log("Dados completos do usuário:", currentSession.user);
          console.log("Metadados do usuário:", currentSession.user.user_metadata);
          
          await fetchPerfil(currentSession.user);
          
          const storedEmpresa = localStorage.getItem("empresaAtual");
          if (storedEmpresa) {
            setEmpresaAtual(JSON.parse(storedEmpresa));
          }
          
          await fetchEmpresas(currentSession.user.id);
        }
        
        return () => {
          subscription?.unsubscribe();
        };
      } catch (error) {
        console.error("Erro ao carregar sessão:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    const cleanup = loadSession();
    
    return () => {
      (async () => {
        if (cleanup) {
          try {
            await cleanup;
          } catch (error) {
            console.error("Erro no cleanup:", error);
          }
        }
      })();
    };
  }, []);

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
        
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Credenciais inválidas. Verifique seu email e senha.");
        } else {
          toast.error(error.message || "Falha no login. Por favor, tente novamente.");
        }
        
        throw error;
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
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

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
