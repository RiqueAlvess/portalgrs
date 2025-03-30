
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
}

interface User {
  id: string;
  nome: string;
  email: string;
  tipoUsuario: "admin" | "normal";
  empresas: Empresa[];
  empresaAtual?: Empresa;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  mudarEmpresa: (empresa: Empresa) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar dados do usuário armazenados no carregamento do componente
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Em uma aplicação real, isso seria uma chamada de API
      // Lógica de login simulada para demonstração
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (email === "admin@exemplo.com" && password === "senha") {
        const empresas = [
          { id: "123", nome: "Empresa Principal Ltda", cnpj: "12.345.678/0001-90" },
          { id: "456", nome: "Filial Sul S.A.", cnpj: "98.765.432/0001-10" },
          { id: "789", nome: "Unidade Norte ME", cnpj: "11.222.333/0001-44" },
        ];
        
        const userData: User = {
          id: "1",
          nome: "Administrador",
          email: "admin@exemplo.com",
          tipoUsuario: "admin",
          empresas: empresas,
          empresaAtual: empresas[0]
        };
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        toast.success("Login realizado com sucesso");
        return true;
      } else if (email === "usuario@exemplo.com" && password === "senha") {
        const empresas = [
          { id: "123", nome: "Empresa Principal Ltda", cnpj: "12.345.678/0001-90" },
          { id: "456", nome: "Filial Sul S.A.", cnpj: "98.765.432/0001-10" },
        ];
        
        const userData: User = {
          id: "2",
          nome: "Usuário Regular",
          email: "usuario@exemplo.com",
          tipoUsuario: "normal",
          empresas: empresas,
          empresaAtual: empresas[0]
        };
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        toast.success("Login realizado com sucesso");
        return true;
      } else {
        toast.error("Credenciais inválidas");
        return false;
      }
    } catch (error) {
      console.error("Erro de login:", error);
      toast.error("Falha no login. Por favor, tente novamente.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    toast.info("Você foi desconectado");
  };

  const mudarEmpresa = (empresa: Empresa) => {
    if (user) {
      const updatedUser = { ...user, empresaAtual: empresa };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      toast.success(`Empresa alterada para: ${empresa.nome}`);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, mudarEmpresa }}>
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
