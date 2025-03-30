
import { useState } from "react";
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
  DialogTrigger,
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

// Interface para os usuários simulados
interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipoUsuario: "admin" | "normal";
  empresasVinculadas: { id: string; nome: string }[];
  ativo: boolean;
}

// Dados simulados de usuários
const usuariosSimulados: Usuario[] = [
  {
    id: "1",
    nome: "Administrador",
    email: "admin@exemplo.com",
    tipoUsuario: "admin",
    empresasVinculadas: [
      { id: "123", nome: "Empresa Principal Ltda" },
      { id: "456", nome: "Filial Sul S.A." },
      { id: "789", nome: "Unidade Norte ME" }
    ],
    ativo: true
  },
  {
    id: "2",
    nome: "Usuário Regular",
    email: "usuario@exemplo.com",
    tipoUsuario: "normal",
    empresasVinculadas: [
      { id: "123", nome: "Empresa Principal Ltda" },
      { id: "456", nome: "Filial Sul S.A." }
    ],
    ativo: true
  },
  {
    id: "3",
    nome: "José Silva",
    email: "jose@exemplo.com",
    tipoUsuario: "normal",
    empresasVinculadas: [
      { id: "123", nome: "Empresa Principal Ltda" }
    ],
    ativo: true
  },
  {
    id: "4",
    nome: "Maria Oliveira",
    email: "maria@exemplo.com",
    tipoUsuario: "normal",
    empresasVinculadas: [
      { id: "456", nome: "Filial Sul S.A." }
    ],
    ativo: false
  }
];

// Dados simulados de empresas disponíveis
const empresasDisponiveis = [
  { id: "123", nome: "Empresa Principal Ltda", cnpj: "12.345.678/0001-90" },
  { id: "456", nome: "Filial Sul S.A.", cnpj: "98.765.432/0001-10" },
  { id: "789", nome: "Unidade Norte ME", cnpj: "11.222.333/0001-44" },
];

const Users = () => {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>(usuariosSimulados);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    tipoUsuario: "normal",
    empresasVinculadas: [] as string[],
    ativo: true
  });

  // Filtrar usuários
  const filteredUsers = usuarios.filter(usuario =>
    usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Iniciar adição de novo usuário
  const handleAddUser = () => {
    setFormData({
      nome: "",
      email: "",
      senha: "",
      tipoUsuario: "normal",
      empresasVinculadas: [],
      ativo: true
    });
    setIsAddingUser(true);
    setEditingUser(null);
  };

  // Iniciar edição de usuário
  const handleEditUser = (user: Usuario) => {
    setFormData({
      nome: user.nome,
      email: user.email,
      senha: "",
      tipoUsuario: user.tipoUsuario,
      empresasVinculadas: user.empresasVinculadas.map(emp => emp.id),
      ativo: user.ativo
    });
    setIsAddingUser(false);
    setEditingUser(user);
  };

  // Salvar usuário (novo ou editado)
  const handleSaveUser = () => {
    if (!formData.nome || !formData.email) {
      toast.error("Nome e email são obrigatórios");
      return;
    }

    if (isAddingUser && !formData.senha) {
      toast.error("Senha é obrigatória para novos usuários");
      return;
    }

    try {
      if (isAddingUser) {
        // Simular adição de novo usuário
        const newUser: Usuario = {
          id: (usuarios.length + 1).toString(),
          nome: formData.nome,
          email: formData.email,
          tipoUsuario: formData.tipoUsuario as "admin" | "normal",
          empresasVinculadas: formData.empresasVinculadas.map(id => {
            const empresa = empresasDisponiveis.find(e => e.id === id);
            return { id, nome: empresa?.nome || "" };
          }),
          ativo: formData.ativo
        };
        
        setUsuarios([...usuarios, newUser]);
        toast.success("Usuário adicionado com sucesso!");
      } else if (editingUser) {
        // Simular edição de usuário existente
        const updatedUsers = usuarios.map(u => {
          if (u.id === editingUser.id) {
            return {
              ...u,
              nome: formData.nome,
              email: formData.email,
              tipoUsuario: formData.tipoUsuario as "admin" | "normal",
              empresasVinculadas: formData.empresasVinculadas.map(id => {
                const empresa = empresasDisponiveis.find(e => e.id === id);
                return { id, nome: empresa?.nome || "" };
              }),
              ativo: formData.ativo
            };
          }
          return u;
        });
        
        setUsuarios(updatedUsers);
        toast.success("Usuário atualizado com sucesso!");
      }
      
      // Limpar form e fechar dialog
      setFormData({
        nome: "",
        email: "",
        senha: "",
        tipoUsuario: "normal",
        empresasVinculadas: [],
        ativo: true
      });
      setIsAddingUser(false);
      setEditingUser(null);
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      toast.error("Ocorreu um erro ao salvar o usuário");
    }
  };

  // Excluir usuário
  const handleDeleteUser = (id: string) => {
    // Verificar se o usuário não está excluindo a si mesmo
    if (id === "1") {
      toast.error("Não é possível excluir o administrador principal");
      return;
    }

    if (confirm("Tem certeza que deseja excluir este usuário?")) {
      setUsuarios(usuarios.filter(u => u.id !== id));
      toast.success("Usuário excluído com sucesso");
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

  if (user?.tipoUsuario !== "admin") {
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
        <Dialog>
          <DialogTrigger asChild>
            <Button onClick={handleAddUser}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
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
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Status</Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Checkbox
                    id="ativo"
                    checked={formData.ativo}
                    onCheckedChange={(checked) => 
                      setFormData({...formData, ativo: checked as boolean})
                    }
                  />
                  <Label htmlFor="ativo">Usuário Ativo</Label>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <Label className="text-right pt-2">Empresas Vinculadas</Label>
                <div className="col-span-3 space-y-2">
                  {empresasDisponiveis.map((empresa) => (
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsAddingUser(false);
                setEditingUser(null);
              }}>
                Cancelar
              </Button>
              <Button onClick={handleSaveUser}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Empresas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell className="font-medium">{usuario.nome}</TableCell>
                      <TableCell>{usuario.email}</TableCell>
                      <TableCell>
                        {usuario.tipoUsuario === "admin" ? "Administrador" : "Usuário Normal"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          {usuario.empresasVinculadas.map((emp) => (
                            <span key={emp.id} className="text-sm">
                              {emp.nome}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          usuario.ativo 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {usuario.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleEditUser(usuario)}
                              >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Editar</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                              {/* O conteúdo do Dialog será preenchido quando o DialogTrigger for clicado */}
                            </DialogContent>
                          </Dialog>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;
