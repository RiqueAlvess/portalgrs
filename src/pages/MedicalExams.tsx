
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Filter, Search, User } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";

// Interface para convocações de exames
interface Convocacao {
  id: string;
  funcionario_id: string;
  nome: string;
  setor: string;
  cargo: string;
  codigo_funcionario?: number;
  exame: string;
  codigo_exame?: string;
  data_convocacao: string;
  refazer?: string;
  status: string;
  ultimo_pedido?: string;
  data_agendamento?: string;
}

// Interface para funcionário com contagens de exames
interface FuncionarioExames {
  id: string;
  codigo?: number;
  nome: string;
  departamento?: string;
  examesVencidos: number;
  examesEmDia: number;
  examesAgendados: number;
  examesAVencer: number;
  exames: Convocacao[];
}

const ExamesMedicos = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFuncionario, setSelectedFuncionario] = useState<FuncionarioExames | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("todos");
  const { toast } = useToast();
  const { empresaAtual } = useAuth();

  // Buscar convocações do Supabase
  const { data: convocacoes, isLoading, error } = useQuery({
    queryKey: ['convocacoes', empresaAtual?.id],
    queryFn: async () => {
      if (!empresaAtual?.id) {
        return [];
      }
      
      const { data, error } = await supabase
        .from('convocacoes')
        .select(`
          id, 
          funcionario_id,
          nome, 
          setor, 
          cargo, 
          codigo_funcionario,
          exame,
          codigo_exame,
          data_convocacao,
          refazer,
          status,
          ultimo_pedido,
          data_agendamento
        `)
        .eq('empresa_id', empresaAtual.id);
        
      if (error) {
        console.error("Erro ao buscar convocações:", error);
        toast({
          title: "Erro ao carregar exames",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      return data as Convocacao[];
    },
    enabled: !!empresaAtual?.id,
  });

  // Processamento de dados - agrupar exames por funcionário
  const funcionariosExames: FuncionarioExames[] = [];
  const funcionariosMap = new Map<string, FuncionarioExames>();

  useEffect(() => {
    if (!convocacoes) return;

    // Limpar mapa atual
    funcionariosMap.clear();

    convocacoes.forEach(convocacao => {
      if (!convocacao.funcionario_id) return;

      let funcionarioExistente = funcionariosMap.get(convocacao.funcionario_id);
      
      const hoje = new Date();
      const status = getStatusExame(convocacao);
      
      if (!funcionarioExistente) {
        funcionarioExistente = {
          id: convocacao.funcionario_id,
          codigo: convocacao.codigo_funcionario,
          nome: convocacao.nome || 'Sem nome',
          departamento: convocacao.setor,
          examesVencidos: 0,
          examesEmDia: 0,
          examesAgendados: 0,
          examesAVencer: 0,
          exames: []
        };
        funcionariosMap.set(convocacao.funcionario_id, funcionarioExistente);
      }

      // Incrementar contadores com base no status
      if (status === "VENCIDO") {
        funcionarioExistente.examesVencidos++;
      } else if (status === "A_VENCER") {
        funcionarioExistente.examesAVencer++;
      } else if (status === "AGENDADO") {
        funcionarioExistente.examesAgendados++;
      } else if (status === "EM_DIA") {
        funcionarioExistente.examesEmDia++;
      }

      // Adicionar exame à lista
      funcionarioExistente.exames.push(convocacao);
    });

    // Converter Map para array
    const funcionariosArray = Array.from(funcionariosMap.values());
    funcionariosArray.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [convocacoes]);

  // Dados de status para o gráfico
  const calcularDadosStatus = () => {
    let vencidos = 0;
    let aVencer = 0;
    let agendados = 0;
    let emDia = 0;
    
    if (convocacoes) {
      convocacoes.forEach(convocacao => {
        const status = getStatusExame(convocacao);
        if (status === "VENCIDO") vencidos++;
        else if (status === "A_VENCER") aVencer++;
        else if (status === "AGENDADO") agendados++;
        else if (status === "EM_DIA") emDia++;
      });
    }
    
    return [
      { name: "Vencidos", value: vencidos, color: "#dc2626" },
      { name: "A Vencer", value: aVencer, color: "#f97316" },
      { name: "Agendados", value: agendados, color: "#0ea5e9" },
      { name: "Em Dia", value: emDia, color: "#10b981" },
    ];
  };

  const statusData = calcularDadosStatus();
  const totalExames = statusData.reduce((sum, item) => sum + item.value, 0) || 1;
  
  // Filtragem dos funcionários com base na busca
  const filteredFuncionarios = Array.from(funcionariosMap.values()).filter(
    (funcionario) =>
      funcionario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (funcionario.codigo?.toString() || "").includes(searchTerm)
  );

  const handleRowClick = (funcionario: FuncionarioExames) => {
    setSelectedFuncionario(funcionario);
    setIsDialogOpen(true);
  };

  // Determinar status do exame com base nas datas
  function getStatusExame(exame: Convocacao): "VENCIDO" | "A_VENCER" | "AGENDADO" | "EM_DIA" {
    if (exame.status === "REALIZADO") return "EM_DIA";
    if (exame.data_agendamento) return "AGENDADO";
    
    const hoje = new Date();
    const dataRefazer = exame.refazer ? new Date(exame.refazer) : null;
    
    if (dataRefazer) {
      // Se a data para refazer já passou
      if (dataRefazer < hoje) return "VENCIDO";
      
      // A vencer em 30 dias
      const trintaDiasDepois = new Date();
      trintaDiasDepois.setDate(hoje.getDate() + 30);
      
      if (dataRefazer <= trintaDiasDepois) return "A_VENCER";
    }
    
    return "EM_DIA";
  }

  // Obter cor da badge de status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "VENCIDO":
        return "destructive";
      case "A_VENCER":
        return "warning";
      case "AGENDADO":
        return "default";
      case "EM_DIA":
        return "success";
      default:
        return "secondary";
    }
  };

  // Formatar data em pt-BR
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
        <h1 className="text-3xl font-bold tracking-tight">Exames Médicos</h1>
        <p className="text-muted-foreground">
          Monitore e gerencie exames médicos e avaliações de saúde dos funcionários
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusData[0].value}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((statusData[0].value / totalExames) * 100)}% do total de exames
            </p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Vencer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusData[1].value}</div>
            <p className="text-xs text-muted-foreground">
              Próximos 30 dias
            </p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusData[2].value}</div>
            <p className="text-xs text-muted-foreground">
              Consultas marcadas
            </p>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusData[3].value}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((statusData[3].value / totalExames) * 100)}% do total de exames
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Distribuição de Status</CardTitle>
            <CardDescription>
              Visão geral de todos os status de exames
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              {isLoading ? (
                <p>Carregando dados...</p>
              ) : error ? (
                <p className="text-red-500">Erro ao carregar dados</p>
              ) : totalExames <= 1 ? (
                <p className="text-center text-muted-foreground">Sem dados suficientes para exibir o gráfico</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Resumo de Exames por Funcionário</CardTitle>
            <CardDescription>
              Visualize o status dos exames médicos por funcionário
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar funcionário..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Status</SelectItem>
                    <SelectItem value="vencidos">Vencidos</SelectItem>
                    <SelectItem value="a_vencer">A Vencer</SelectItem>
                    <SelectItem value="agendados">Agendados</SelectItem>
                    <SelectItem value="em_dia">Em Dia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isLoading ? (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">Carregando exames médicos...</p>
                </div>
              ) : error ? (
                <div className="py-8 text-center">
                  <p className="text-red-500">Erro ao carregar dados.</p>
                  <p className="text-sm text-muted-foreground">Por favor, tente novamente mais tarde.</p>
                </div>
              ) : filteredFuncionarios.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">
                    {funcionariosMap.size === 0 
                      ? "Nenhum exame médico encontrado." 
                      : "Nenhum funcionário corresponde à sua busca."}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Funcionário</TableHead>
                        <TableHead className="text-center">Vencidos</TableHead>
                        <TableHead className="text-center">A Vencer</TableHead>
                        <TableHead className="text-center">Agendados</TableHead>
                        <TableHead className="text-center">Em Dia</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFuncionarios.map((funcionario) => (
                        <TableRow 
                          key={funcionario.id} 
                          className="cursor-pointer"
                          onClick={() => handleRowClick(funcionario)}
                        >
                          <TableCell className="font-medium">{funcionario.nome}</TableCell>
                          <TableCell className="text-center">
                            {funcionario.examesVencidos > 0 && (
                              <Badge variant="destructive">{funcionario.examesVencidos}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {funcionario.examesAVencer > 0 && (
                              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                {funcionario.examesAVencer}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {funcionario.examesAgendados > 0 && (
                              <Badge>{funcionario.examesAgendados}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {funcionario.examesEmDia > 0 && (
                              <Badge variant="outline">{funcionario.examesEmDia}</Badge>
                            )}
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
      </div>

      {/* Diálogo de Detalhes de Exames do Funcionário */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Exames Médicos do Funcionário</DialogTitle>
            <DialogDescription>Informações detalhadas de exames para {selectedFuncionario?.nome}</DialogDescription>
          </DialogHeader>
          
          {selectedFuncionario && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="flex items-center justify-center bg-muted rounded-full p-4">
                  <User className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold">{selectedFuncionario.nome}</h3>
                  <p className="text-muted-foreground">{selectedFuncionario.departamento || "Sem departamento"}</p>
                  <p className="text-sm">Código: {selectedFuncionario.codigo || "Não informado"}</p>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exame</TableHead>
                      <TableHead>Data Limite</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Último Realizado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedFuncionario.exames.map((exame) => {
                      const status = getStatusExame(exame);
                      return (
                        <TableRow key={exame.id}>
                          <TableCell className="font-medium">{exame.exame || "Sem nome"}</TableCell>
                          <TableCell>{exame.refazer ? formatDate(exame.refazer) : "Não definido"}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(status) as any}>
                              {status === "VENCIDO" ? "Vencido" : 
                               status === "A_VENCER" ? "A Vencer" : 
                               status === "AGENDADO" ? "Agendado" : 
                               "Em Dia"}
                            </Badge>
                          </TableCell>
                          <TableCell>{exame.ultimo_pedido ? formatDate(exame.ultimo_pedido) : "Nunca"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">Agendar Exames</Button>
                <Button>Exportar Dados</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExamesMedicos;
