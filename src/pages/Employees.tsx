
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";

// Interface para funcionários
interface Funcionario {
  id: string;
  codigo?: number;
  nome: string;
  departamento?: string;
  cargo: string;
  situacao?: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  data_admissao: string;
  codigo_setor?: string;
  nome_setor?: string;
  nome_cargo?: string;
  status?: string;
  telefone_celular?: string;
  data_nascimento?: string;
}

const Funcionarios = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFuncionario, setSelectedFuncionario] = useState<null | Funcionario>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { empresaAtual } = useAuth();

  // Buscar funcionários do Supabase
  const { data: funcionarios, isLoading, error } = useQuery({
    queryKey: ['funcionarios', empresaAtual?.id],
    queryFn: async () => {
      if (!empresaAtual?.id) {
        return [];
      }
      
      const { data, error } = await supabase
        .from('funcionarios')
        .select('*')
        .eq('empresa_id', empresaAtual.id);
        
      if (error) {
        console.error("Erro ao buscar funcionários:", error);
        toast({
          title: "Erro ao carregar funcionários",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      return data as Funcionario[];
    },
    enabled: !!empresaAtual?.id,
  });

  // Filtrar funcionários baseado no termo de busca
  const filteredFuncionarios = funcionarios?.filter(
    (funcionario) =>
      funcionario.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      funcionario.cpf?.includes(searchTerm) ||
      (funcionario.codigo?.toString() || "").includes(searchTerm)
  ) || [];

  const handleRowClick = (funcionario: Funcionario) => {
    setSelectedFuncionario(funcionario);
    setIsDialogOpen(true);
  };

  // Função para determinar a cor do status
  const getStatusVariant = (status?: string) => {
    if (!status) return "default";
    
    switch (status.toLowerCase()) {
      case "ativo":
        return "default";
      case "inativo":
        return "destructive";
      case "férias":
        return "secondary";
      case "afastado":
        return "secondary";
      default:
        return "default";
    }
  };

  // Formatação de data brasileira
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Não informado";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Funcionários</h1>
        <p className="text-muted-foreground">
          Gerencie as informações e registros de seus colaboradores
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registros de Funcionários</CardTitle>
          <CardDescription>
            Visualize e gerencie informações detalhadas sobre seus funcionários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por nome, CPF ou código..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
            </div>

            {isLoading ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">Carregando funcionários...</p>
              </div>
            ) : error ? (
              <div className="py-8 text-center">
                <p className="text-red-500">Erro ao carregar dados.</p>
                <p className="text-sm text-muted-foreground">Por favor, tente novamente mais tarde.</p>
              </div>
            ) : filteredFuncionarios.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">
                  {funcionarios?.length === 0 
                    ? "Nenhum funcionário encontrado." 
                    : "Nenhum funcionário corresponde à sua busca."}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead className="hidden md:table-cell">Setor</TableHead>
                      <TableHead className="hidden md:table-cell">Cargo</TableHead>
                      <TableHead>Situação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFuncionarios.map((funcionario) => (
                      <TableRow 
                        key={funcionario.id} 
                        className="cursor-pointer"
                        onClick={() => handleRowClick(funcionario)}
                      >
                        <TableCell>{funcionario.codigo || "—"}</TableCell>
                        <TableCell className="font-medium">{funcionario.nome}</TableCell>
                        <TableCell className="hidden md:table-cell">{funcionario.nome_setor || funcionario.departamento || "—"}</TableCell>
                        <TableCell className="hidden md:table-cell">{funcionario.nome_cargo || funcionario.cargo || "—"}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={getStatusVariant(funcionario.situacao || funcionario.status)}
                          >
                            {funcionario.situacao || funcionario.status || "Ativo"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de Detalhes do Funcionário */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Funcionário</DialogTitle>
            <DialogDescription>Informações detalhadas sobre o funcionário selecionado</DialogDescription>
          </DialogHeader>
          
          {selectedFuncionario && (
            <Tabs defaultValue="pessoal">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pessoal">Dados Pessoais</TabsTrigger>
                <TabsTrigger value="profissional">Dados Profissionais</TabsTrigger>
                <TabsTrigger value="saude">Saúde Ocupacional</TabsTrigger>
              </TabsList>

              <TabsContent value="pessoal" className="space-y-4 pt-4">
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  <div className="flex items-center justify-center bg-muted rounded-full p-6">
                    <User className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold">{selectedFuncionario.nome}</h3>
                    <p className="text-muted-foreground">{selectedFuncionario.nome_cargo || selectedFuncionario.cargo}</p>
                    <Badge 
                      variant={getStatusVariant(selectedFuncionario.situacao || selectedFuncionario.status)}
                    >
                      {selectedFuncionario.situacao || selectedFuncionario.status || "Ativo"}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Código</p>
                    <p className="text-sm text-muted-foreground">{selectedFuncionario.codigo || "Não informado"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">CPF</p>
                    <p className="text-sm text-muted-foreground">{selectedFuncionario.cpf || "Não informado"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{selectedFuncionario.email || "Não informado"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Telefone</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedFuncionario.telefone_celular || selectedFuncionario.telefone || "Não informado"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Data de Nascimento</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedFuncionario.data_nascimento ? formatDate(selectedFuncionario.data_nascimento) : "Não informado"}
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="profissional" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Setor</p>
                    <p className="text-sm text-muted-foreground">{selectedFuncionario.nome_setor || selectedFuncionario.departamento || "Não informado"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Cargo</p>
                    <p className="text-sm text-muted-foreground">{selectedFuncionario.nome_cargo || selectedFuncionario.cargo || "Não informado"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Data de Admissão</p>
                    <p className="text-sm text-muted-foreground">{formatDate(selectedFuncionario.data_admissao)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Situação</p>
                    <p className="text-sm text-muted-foreground">{selectedFuncionario.situacao || selectedFuncionario.status || "Ativo"}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="saude" className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">Nenhum registro de saúde ocupacional disponível para este funcionário.</p>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Funcionarios;
