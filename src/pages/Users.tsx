import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserForm } from "@/components/UserForm";
import { UserList } from "@/components/UserList";
import { CryptoDemo } from "@/components/CryptoDemo";

interface Usuario {
  id: string;
  email: string;
  nome: string;
  tipo_usuario: "admin" | "normal";
  empresas: { id: string; nome: string }[];
  telas: { id: string; nome: string; permissao_leitura?: boolean; permissao_escrita?: boolean; permissao_exclusao?: boolean }[];
  ativo: boolean;
}

interface Tela {
  id: string;
  nome: string;
  codigo: string;
  descricao: string | null;
}

interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
}

// Define the correct FormData interface to match what's used in the UserForm component
interface FormData {
  nome: string;
  email: string;
  senha: string;
  tipoUsuario: "admin" | "normal"; // This is the key fix - restricting to only these two values
  empresasVinculadas: string[];
  telasVinculadas: {
    id: string; 
    permissao_leitura: boolean; 
    permissao_escrita: boolean; 
    permissao_exclusao: boolean;
  }[];
  ativo: boolean;
}

const Users = () => {
  const { user: currentUser, perfil: usuarioAtual } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [telas, setTelas] = useState<Tela[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [empresasPagination, setEmpresasPagination] = useState({
    page: 0,
    limit: 100,
    loading: false,
    hasMore: true
  });
  
  const [formData, setFormData] = useState<FormData>({
    nome: "",
    email: "",
    senha: "",
    tipoUsuario: "normal", // Explicitly set as "normal" to match the union type
    empresasVinculadas: [] as string[],
    telasVinculadas: [] as {
      id: string; 
      permissao_leitura: boolean; 
      permissao_escrita: boolean; 
      permissao_exclusao: boolean;
    }[],
    ativo: true
  });

  const isAdmin = currentUser?.user_metadata?.tipo_usuario === 'admin' || usuarioAtual?.tipo_usuario === 'admin';

  // Função para carregar empresas via Edge Function para evitar problemas de RLS
  const carregarEmpresas = async () => {
    setLoadingEmpresas(true);
    setEmpresas([]);
    
    try {
      console.log("Carregando empresas via Edge Function...");
      const { data: empresasData, error: empresasError } = await supabase.functions.invoke('getEmpresas', {
        body: {}
      });
      
      if (empresasError) {
        throw empresasError;
      }
      
      if (empresasData && Array.isArray(empresasData.empresas)) {
        console.log(`Empresas carregadas via Edge Function: ${empresasData.empresas.length}`);
        setEmpresas(empresasData.empresas);
        return;
      }
    } catch (edgeFunctionError) {
      console.error("Erro ao buscar empresas via Edge Function:", edgeFunctionError);
      console.log("Tentando método alternativo para buscar empresas...");
      
      try {
        // Fallback: busca direta sem joins para evitar recursão
        const { data: directEmpresasData, error: directEmpresasError } = await supabase
          .from("empresas")
          .select("id, nome, cnpj")
          .order('nome', { ascending: true });
          
        if (directEmpresasError) {
          console.error("Erro ao buscar empresas diretamente:", directEmpresasError);
          toast.error("Não foi possível carregar as empresas. Por favor, tente novamente mais tarde.");
          return;
        }
        
        if (directEmpresasData) {
          console.log(`Empresas carregadas diretamente: ${directEmpresasData.length}`);
          setEmpresas(directEmpresasData);
        }
      } catch (error) {
        console.error("Erro no fallback de empresas:", error);
        toast.error(`Não foi possível carregar as empresas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    } finally {
      setLoadingEmpresas(false);
    }
  };

  // Função para carregar todas as telas
  const carregarTelas = async () => {
    try {
      console.log("Carregando todas as telas...");
      
      const { data, error } = await supabase
        .from("telas")
        .select("*")
        .eq("ativo", true)
        .order('nome', { ascending: true });
      
      if (error) {
        console.error("Erro ao carregar telas:", error);
        toast.error(`Erro ao carregar telas: ${error.message}`);
        return;
      }
      
      if (data) {
        console.log(`Total de telas carregadas: ${data.length}`);
        setTelas(data);
      }
    } catch (error) {
      console.error("Erro ao carregar telas:", error);
      toast.error(`Erro ao carregar telas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  // Função para carregar usuários
  const carregarUsuarios = async () => {
    setIsLoading(true);
    setLoadError(null);
    
    try {
      console.log("Buscando usuários via Edge Function...");
      const { data, error } = await supabase.functions.invoke('getUsers', {
        body: {}
      });
      
      if (error) {
        console.error("Erro ao invocar Edge Function getUsers:", error);
        throw new Error(`Erro ao carregar usuários: ${error.message}`);
      }
      
      if (!data || !data.success || !Array.isArray(data.users)) {
        console.error("Resposta inválida da função getUsers:", data);
        throw new Error("Erro ao carregar usuários: formato de resposta inválido");
      }

      console.log("Usuários carregados via edge function:", data.users.length);
      setUsuarios(data.users);
    } catch (error: any) {
      setLoadError(error.message || "Falha ao carregar usuários");
      console.error("Erro ao carregar usuários:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (isAdmin) {
        try {
          console.log("Carregando dados da página de usuários...");
          
          // Carregar empresas e telas em paralelo
          await Promise.all([
            carregarEmpresas(),
            carregarTelas(),
            carregarUsuarios()
          ]);
        } catch (error: any) {
          setLoadError(error.message || "Falha ao carregar dados");
          console.error("Erro ao carregar dados:", error);
          toast.error("Erro ao carregar dados");
        }
      }
    };

    loadData();
  }, [isAdmin, currentUser]);

  const filteredUsers = usuarios.filter(usuario =>
    usuario.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUser = () => {
    const telasIniciais = telas.map(tela => ({
      id: tela.id,
      permissao_leitura: true,
      permissao_escrita: false,
      permissao_exclusao: false
    }));

    setFormData({
      nome: "",
      email: "",
      senha: "",
      tipoUsuario: "normal", // Ensure this is explicitly "normal"
      empresasVinculadas: [],
      telasVinculadas: telasIniciais,
      ativo: true
    });
    setIsAddingUser(true);
    setEditingUser(null);
    setIsDialogOpen(true);
  };

  const handleEditUser = (user: Usuario) => {
    const telasVinculadas = telas.map(tela => {
      const telaUsuario = user.telas.find(t => t.id === tela.id);
      return {
        id: tela.id,
        permissao_leitura: telaUsuario?.permissao_leitura ?? true,
        permissao_escrita: telaUsuario?.permissao_escrita ?? false,
        permissao_exclusao: telaUsuario?.permissao_exclusao ?? false
      };
    });

    setFormData({
      nome: user.nome,
      email: user.email,
      senha: "",
      tipoUsuario: user.tipo_usuario, // This must be "admin" or "normal"
      empresasVinculadas: user.empresas.map(emp => emp.id),
      telasVinculadas,
      ativo: user.ativo
    });
    setIsAddingUser(false);
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!formData.nome || !formData.email) {
      toast.error("Nome e email são obrigatórios");
      return;
    }

    if (isAddingUser && !formData.senha) {
      toast.error("Senha é obrigatória para novos usuários");
      return;
    }

    setIsLoading(true);

    try {
      if (isAddingUser) {
        console.log("Criando novo usuário...");
        console.log("Empresas vinculadas:", formData.empresasVinculadas.length);
        console.log("Telas vinculadas:", formData.telasVinculadas.length);
        
        const { data, error } = await supabase.functions.invoke('manageUser', {
          body: {
            action: 'create',
            userData: {
              email: formData.email,
              password: formData.senha,
              user_metadata: {
                nome: formData.nome,
                tipo_usuario: formData.tipoUsuario
              }
            },
            empresas: formData.empresasVinculadas,
            telas: formData.telasVinculadas
          }
        });

        if (error) {
          console.error("Erro ao invocar Edge Function manageUser:", error);
          throw new Error(`Erro ao criar usuário: ${error.message}`);
        }

        if (!data || !data.success) {
          console.error("Resposta inválida da função manageUser:", data);
          throw new Error(data?.message || "Erro ao criar usuário");
        }

        toast.success("Usuário adicionado com sucesso!");
      } else if (editingUser) {
        console.log("Atualizando usuário existente...");
        console.log("Empresas vinculadas:", formData.empresasVinculadas.length);
        console.log("Telas vinculadas:", formData.telasVinculadas.length);
        
        const { data, error } = await supabase.functions.invoke('manageUser', {
          body: {
            action: 'update',
            userId: editingUser.id,
            userData: {
              email: formData.email,
              password: formData.senha || undefined,
              user_metadata: {
                nome: formData.nome,
                tipo_usuario: formData.tipoUsuario
              }
            },
            empresas: formData.empresasVinculadas,
            telas: formData.telasVinculadas
          }
        });

        if (error) {
          console.error("Erro ao invocar Edge Function manageUser:", error);
          throw new Error(`Erro ao atualizar usuário: ${error.message}`);
        }

        if (!data || !data.success) {
          console.error("Resposta inválida da função manageUser:", data);
          throw new Error(data?.message || "Erro ao atualizar usuário");
        }

        toast.success("Usuário atualizado com sucesso!");
      }

      // Recarregar dados
      await carregarUsuarios();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      toast.error("Ocorreu um erro ao salvar o usuário: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (id === usuarioAtual?.id || id === currentUser?.id) {
      toast.error("Não é possível excluir seu próprio usuário");
      return;
    }

    if (confirm("Tem certeza que deseja excluir este usuário?")) {
      setIsLoading(true);
      try {
        console.log("Excluindo usuário:", id);
        const { data, error } = await supabase.functions.invoke('manageUser', {
          body: {
            action: 'delete',
            userId: id
          }
        });
        
        if (error) {
          console.error("Erro ao invocar Edge Function manageUser:", error);
          throw new Error(`Erro ao excluir usuário: ${error.message}`);
        }
        
        if (!data || !data.success) {
          console.error("Resposta inválida da função manageUser:", data);
          throw new Error(data?.message || "Erro ao excluir usuário");
        }
        
        toast.success("Usuário excluído com sucesso");
        
        setUsuarios(usuarios.filter(u => u.id !== id));
      } catch (error) {
        console.error("Erro ao excluir usuário:", error);
        toast.error("Ocorreu um erro ao excluir o usuário: " + (error as Error).message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleReload = async () => {
    await carregarUsuarios();
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>
              Você não tem permissão para acessar esta página.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Esta área é restrita a administradores do sistema.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.history.back()}>Voltar</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciamento de Usuários</h1>
        <Button onClick={handleAddUser}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <Tabs defaultValue="usuarios" className="mb-6">
        <TabsList>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="criptografia">Criptografia</TabsTrigger>
        </TabsList>
        
        <TabsContent value="usuarios">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>Usuários do Sistema</CardTitle>
                <div className="relative w-full sm:w-64">
                  <Input
                    type="search"
                    placeholder="Buscar usuários..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <UserList 
                usuarios={usuarios} 
                filteredUsers={filteredUsers}
                isLoading={isLoading}
                loadError={loadError}
                handleEditUser={handleEditUser}
                handleDeleteUser={handleDeleteUser}
                handleReload={handleReload}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="criptografia">
          <CryptoDemo />
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isAddingUser ? "Adicionar Novo Usuário" : "Editar Usuário"}
            </DialogTitle>
            <DialogDescription>
              Preencha os campos para {isAddingUser ? "adicionar um novo usuário" : "atualizar os dados do usuário"}.
            </DialogDescription>
          </DialogHeader>
          
          <UserForm
            formData={formData}
            setFormData={setFormData}
            empresas={empresas}
            telas={telas}
            isAddingUser={isAddingUser}
            loadingEmpresas={loadingEmpresas}
          />
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUser} disabled={isLoading}>
              {isLoading ? 
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </> : 
                "Salvar"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
