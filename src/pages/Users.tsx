
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Interface para os usuários
interface Usuario {
  id: string;
  email: string;
  perfil: {
    nome: string;
    tipo_usuario: "admin" | "normal";
  };
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

const Users = () => {
  const { perfil: usuarioAtual } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [telas, setTelas] = useState<Tela[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    tipoUsuario: "normal",
    empresasVinculadas: [] as string[],
    telasVinculadas: [] as {
      id: string; 
      permissao_leitura: boolean; 
      permissao_escrita: boolean; 
      permissao_exclusao: boolean;
    }[],
    ativo: true
  });

  // Carregar usuários, empresas e telas
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Buscar empresas
        const { data: empresasData, error: empresasError } = await supabase
          .from("empresas")
          .select("id, nome, cnpj");

        if (empresasError) {
          console.error("Erro ao carregar empresas:", empresasError);
          toast.error("Erro ao carregar empresas");
        } else if (empresasData) {
          setEmpresas(empresasData);
        }

        // Buscar telas
        const { data: telasData, error: telasError } = await supabase
          .from("telas")
          .select("*")
          .eq("ativo", true);

        if (telasError) {
          console.error("Erro ao carregar telas:", telasError);
          toast.error("Erro ao carregar telas");
        } else if (telasData) {
          setTelas(telasData);
        }

        // Buscar usuários com seus emails
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        
        if (authError) {
          console.error("Erro ao carregar usuários:", authError);
          toast.error("Erro ao carregar usuários");
          return;
        }
        
        // Mapear usuários auth para um objeto com id -> email
        const usersEmailMap: Record<string, string> = {};
        if (authUsers?.users) {
          authUsers.users.forEach((user: any) => {
            if (user && typeof user === 'object' && 'id' in user && 'email' in user) {
              usersEmailMap[user.id] = user.email || '';
            }
          });
        }

        // Buscar perfis
        const { data: perfilsData, error: perfilsError } = await supabase
          .from("perfis")
          .select(`
            id,
            nome,
            tipo_usuario
          `);

        if (perfilsError) {
          console.error("Erro ao carregar perfis:", perfilsError);
          toast.error("Erro ao carregar perfis");
          return;
        }

        if (perfilsData) {
          // Para cada perfil, buscar suas empresas e telas vinculadas
          const usuariosCompletos = await Promise.all(
            perfilsData.map(async (perfil) => {
              // Buscar empresas vinculadas ao usuário
              const { data: vinculacoesEmpresas, error: vinculacoesEmpresasError } = await supabase
                .from("usuario_empresas")
                .select(`
                  empresa_id,
                  empresa:empresa_id(id, nome)
                `)
                .eq("usuario_id", perfil.id);

              if (vinculacoesEmpresasError) {
                console.error("Erro ao carregar empresas do usuário:", vinculacoesEmpresasError);
              }

              // Buscar telas vinculadas ao usuário
              const { data: vinculacoesTelas, error: vinculacoesTelaError } = await supabase
                .from("acesso_telas")
                .select(`
                  tela_id,
                  permissao_leitura,
                  permissao_escrita,
                  permissao_exclusao,
                  tela:tela_id(id, nome)
                `)
                .eq("usuario_id", perfil.id);

              if (vinculacoesTelaError) {
                console.error("Erro ao carregar telas do usuário:", vinculacoesTelaError);
              }

              // Formatação das empresas do usuário
              const empresasUsuario = vinculacoesEmpresas?.map(v => ({
                id: v.empresa.id,
                nome: v.empresa.nome
              })) || [];

              // Formatação das telas do usuário
              const telasUsuario = vinculacoesTelas?.map(v => ({
                id: v.tela.id,
                nome: v.tela.nome,
                permissao_leitura: v.permissao_leitura,
                permissao_escrita: v.permissao_escrita,
                permissao_exclusao: v.permissao_exclusao
              })) || [];

              return {
                id: perfil.id,
                email: usersEmailMap[perfil.id] || "Email não encontrado",
                perfil: {
                  nome: perfil.nome,
                  tipo_usuario: perfil.tipo_usuario as "admin" | "normal"
                },
                empresas: empresasUsuario,
                telas: telasUsuario,
                ativo: true // Assumimos como ativo por padrão
              };
            })
          );

          setUsuarios(usuariosCompletos);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast.error("Erro ao carregar dados");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Filtrar usuários
  const filteredUsers = usuarios.filter(usuario =>
    usuario.perfil.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Iniciar adição de novo usuário
  const handleAddUser = () => {
    // Inicializar form data com todas as telas disponíveis
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
      tipoUsuario: "normal",
      empresasVinculadas: [],
      telasVinculadas: telasIniciais,
      ativo: true
    });
    setIsAddingUser(true);
    setEditingUser(null);
    setIsDialogOpen(true);
  };

  // Iniciar edição de usuário
  const handleEditUser = (user: Usuario) => {
    // Mapear telas existentes e preencher com permissões do usuário
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
      nome: user.perfil.nome,
      email: user.email,
      senha: "",
      tipoUsuario: user.perfil.tipo_usuario,
      empresasVinculadas: user.empresas.map(emp => emp.id),
      telasVinculadas,
      ativo: user.ativo
    });
    setIsAddingUser(false);
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  // Salvar usuário (novo ou editado)
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
        // 1. Criar usuário na autenticação
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: formData.email,
          password: formData.senha,
          email_confirm: true,
          user_metadata: {
            nome: formData.nome,
            tipo_usuario: formData.tipoUsuario
          }
        });

        if (authError) {
          throw new Error(authError.message);
        }

        if (!authData.user) {
          throw new Error("Erro ao criar usuário");
        }

        const userId = authData.user.id;

        // 2. O trigger já deve ter criado o perfil, mas vamos atualizar os dados
        const { error: perfilError } = await supabase
          .from("perfis")
          .update({
            nome: formData.nome,
            tipo_usuario: formData.tipoUsuario
          })
          .eq("id", userId);

        if (perfilError) {
          throw new Error("Erro ao atualizar perfil: " + perfilError.message);
        }

        // 3. Vincular empresas ao usuário
        for (const empresaId of formData.empresasVinculadas) {
          const { error: vincError } = await supabase
            .from("usuario_empresas")
            .insert({
              usuario_id: userId,
              empresa_id: empresaId
            });

          if (vincError) {
            console.error("Erro ao vincular empresa:", vincError);
          }
        }

        // 4. Vincular telas ao usuário
        for (const tela of formData.telasVinculadas) {
          if (tela.permissao_leitura) {
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
              console.error("Erro ao vincular tela:", telaError);
            }
          }
        }

        toast.success("Usuário adicionado com sucesso!");
      } else if (editingUser) {
        // 1. Atualizar perfil
        const { error: perfilError } = await supabase
          .from("perfis")
          .update({
            nome: formData.nome,
            tipo_usuario: formData.tipoUsuario
          })
          .eq("id", editingUser.id);

        if (perfilError) {
          throw new Error("Erro ao atualizar perfil: " + perfilError.message);
        }

        // 2. Atualizar senha (se fornecida)
        if (formData.senha) {
          const { error: passwordError } = await supabase.auth.admin.updateUserById(
            editingUser.id,
            { password: formData.senha }
          );

          if (passwordError) {
            throw new Error("Erro ao atualizar senha: " + passwordError.message);
          }
        }

        // 3. Remover todas as vinculações de empresas e adicionar as novas
        const { error: deleteEmpresasError } = await supabase
          .from("usuario_empresas")
          .delete()
          .eq("usuario_id", editingUser.id);

        if (deleteEmpresasError) {
          console.error("Erro ao limpar empresas vinculadas:", deleteEmpresasError);
        }

        // 4. Vincular as empresas selecionadas
        for (const empresaId of formData.empresasVinculadas) {
          const { error: vincEmpresaError } = await supabase
            .from("usuario_empresas")
            .insert({
              usuario_id: editingUser.id,
              empresa_id: empresaId
            });

          if (vincEmpresaError) {
            console.error("Erro ao vincular empresa:", vincEmpresaError);
          }
        }

        // 5. Remover todas as vinculações de telas e adicionar as novas
        const { error: deleteTelaError } = await supabase
          .from("acesso_telas")
          .delete()
          .eq("usuario_id", editingUser.id);

        if (deleteTelaError) {
          console.error("Erro ao limpar telas vinculadas:", deleteTelaError);
        }

        // 6. Vincular as telas selecionadas com suas permissões
        for (const tela of formData.telasVinculadas) {
          if (tela.permissao_leitura) {
            const { error: telaError } = await supabase
              .from("acesso_telas")
              .insert({
                usuario_id: editingUser.id,
                tela_id: tela.id,
                permissao_leitura: tela.permissao_leitura,
                permissao_escrita: tela.permissao_escrita,
                permissao_exclusao: tela.permissao_exclusao
              });

            if (telaError) {
              console.error("Erro ao vincular tela:", telaError);
            }
          }
        }

        toast.success("Usuário atualizado com sucesso!");
      }

      // Recarregar dados
      window.location.reload();
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      toast.error("Ocorreu um erro ao salvar o usuário: " + (error as Error).message);
    } finally {
      setIsLoading(false);
      setIsDialogOpen(false);
    }
  };

  // Excluir usuário
  const handleDeleteUser = async (id: string) => {
    // Verificar se o usuário não está excluindo a si mesmo
    if (id === usuarioAtual?.id) {
      toast.error("Não é possível excluir seu próprio usuário");
      return;
    }

    if (confirm("Tem certeza que deseja excluir este usuário?")) {
      setIsLoading(true);
      try {
        // Excluir o usuário da autenticação - as tabelas relacionadas serão excluídas por causa das constraints ON DELETE CASCADE
        const { error } = await supabase.auth.admin.deleteUser(id);
        
        if (error) {
          throw new Error(error.message);
        }
        
        toast.success("Usuário excluído com sucesso");
        
        // Atualizar lista de usuários
        setUsuarios(usuarios.filter(u => u.id !== id));
      } catch (error) {
        console.error("Erro ao excluir usuário:", error);
        toast.error("Ocorreu um erro ao excluir o usuário: " + (error as Error).message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Toggle para empresa vinculada no form
  const toggleEmpresa = (empresaId: string) => {
    setFormData(prev => {
      if (prev.empresasVinculadas.includes(empresaId)) {
        return {
          ...prev,
          empresasVinculadas: prev.empresasVinculadas.filter(id => id !== empresaId)
        };
      } else {
        return {
          ...prev,
          empresasVinculadas: [...prev.empresasVinculadas, empresaId]
        };
      }
    });
  };

  // Atualizar permissões de tela
  const updateTelaPermission = (telaId: string, permissionType: 'permissao_leitura' | 'permissao_escrita' | 'permissao_exclusao', value: boolean) => {
    setFormData(prev => {
      const newTelasVinculadas = [...prev.telasVinculadas];
      const telaIndex = newTelasVinculadas.findIndex(t => t.id === telaId);
      
      if (telaIndex >= 0) {
        newTelasVinculadas[telaIndex] = {
          ...newTelasVinculadas[telaIndex],
          [permissionType]: value
        };
        
        // Se desmarcar leitura, desmarcar também escrita e exclusão
        if (permissionType === 'permissao_leitura' && !value) {
          newTelasVinculadas[telaIndex].permissao_escrita = false;
          newTelasVinculadas[telaIndex].permissao_exclusao = false;
        }
        
        // Se marcar escrita/exclusão, garantir que leitura esteja marcada
        if ((permissionType === 'permissao_escrita' || permissionType === 'permissao_exclusao') && value) {
          newTelasVinculadas[telaIndex].permissao_leitura = true;
        }
      }
      
      return {
        ...prev,
        telasVinculadas: newTelasVinculadas
      };
    });
  };

  if (usuarioAtual?.tipo_usuario !== "admin") {
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

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Usuários do Sistema</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar usuários..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-2.5"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sidebar-accent"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Empresas</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((usuario) => (
                      <TableRow key={usuario.id}>
                        <TableCell className="font-medium">{usuario.perfil.nome}</TableCell>
                        <TableCell>{usuario.email}</TableCell>
                        <TableCell>
                          {usuario.perfil.tipo_usuario === "admin" ? "Administrador" : "Usuário Normal"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            {usuario.empresas.map((emp) => (
                              <span key={emp.id} className="text-sm">
                                {emp.nome}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditUser(usuario)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteUser(usuario.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Excluir</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para adicionar/editar usuário */}
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
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nome" className="text-right">
                Nome
              </Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="col-span-3"
                disabled={!isAddingUser}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="senha" className="text-right">
                Senha
              </Label>
              <Input
                id="senha"
                type="password"
                placeholder={isAddingUser ? "" : "Deixe em branco para manter a mesma"}
                value={formData.senha}
                onChange={(e) => setFormData({...formData, senha: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tipoUsuario" className="text-right">
                Tipo de Usuário
              </Label>
              <Select
                value={formData.tipoUsuario}
                onValueChange={(value) => setFormData({...formData, tipoUsuario: value as "admin" | "normal"})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione um tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="normal">Usuário Normal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Empresas Vinculadas */}
            <div className="grid grid-cols-4 gap-4">
              <Label className="text-right pt-2">Empresas Vinculadas</Label>
              <div className="col-span-3 space-y-2">
                {empresas.map((empresa) => (
                  <div key={empresa.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`empresa-${empresa.id}`}
                      checked={formData.empresasVinculadas.includes(empresa.id)}
                      onCheckedChange={() => toggleEmpresa(empresa.id)}
                    />
                    <Label htmlFor={`empresa-${empresa.id}`}>
                      {empresa.nome} <span className="text-xs text-muted-foreground">({empresa.cnpj})</span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Telas e Permissões */}
            <div className="grid grid-cols-4 gap-4">
              <Label className="text-right pt-2">Permissões de Telas</Label>
              <div className="col-span-3">
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tela</TableHead>
                        <TableHead className="text-center">Leitura</TableHead>
                        <TableHead className="text-center">Escrita</TableHead>
                        <TableHead className="text-center">Exclusão</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {telas.map((tela) => {
                        const telaVinculada = formData.telasVinculadas.find(t => t.id === tela.id);
                        const leitura = telaVinculada?.permissao_leitura ?? false;
                        const escrita = telaVinculada?.permissao_escrita ?? false;
                        const exclusao = telaVinculada?.permissao_exclusao ?? false;
                        
                        return (
                          <TableRow key={tela.id}>
                            <TableCell>{tela.nome}</TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={leitura}
                                onCheckedChange={(checked) => 
                                  updateTelaPermission(tela.id, 'permissao_leitura', !!checked)
                                }
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={escrita}
                                disabled={!leitura}
                                onCheckedChange={(checked) => 
                                  updateTelaPermission(tela.id, 'permissao_escrita', !!checked)
                                }
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={exclusao}
                                disabled={!leitura}
                                onCheckedChange={(checked) => 
                                  updateTelaPermission(tela.id, 'permissao_exclusao', !!checked)
                                }
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUser} disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
