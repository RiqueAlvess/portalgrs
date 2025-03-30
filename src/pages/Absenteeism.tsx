
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, ChevronDown, Filter, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Interface para os dados de absenteísmo
interface AbsenteismoData {
  // Contador geral
  totalAusencias: number;
  diasPerdidos: number;
  funcionariosAfetados: number;
  taxaAbsenteismo: number;
  
  // Dados para gráficos
  tendenciaMensal: {
    name: string;
    days: number;
    count: number;
  }[];
  
  distribuicaoTipos: {
    name: string;
    value: number;
    color: string;
  }[];
  
  departamentos: {
    name: string;
    days: number;
    count: number;
  }[];
  
  topCids: {
    name: string;
    value: number;
    color: string;
  }[];
}

const cores = {
  licencaMedica: "#0ea5e9",
  licencaMaternidade: "#f97316", 
  acidenteTrabalho: "#dc2626",
  outrosAfastamentos: "#8b5cf6",
  cid1: "#0ea5e9",
  cid2: "#8b5cf6",
  cid3: "#f97316",
  cid4: "#10b981",
  cid5: "#dc2626"
};

const Absenteismo = () => {
  const { empresaAtual } = useAuth();
  const [period, setPeriod] = useState("90days");
  const [metric, setMetric] = useState("days");
  const [loading, setLoading] = useState(true);
  const [dados, setDados] = useState<AbsenteismoData>({
    totalAusencias: 0,
    diasPerdidos: 0,
    funcionariosAfetados: 0,
    taxaAbsenteismo: 0,
    tendenciaMensal: [],
    distribuicaoTipos: [],
    departamentos: [],
    topCids: []
  });

  // Função para calcular a data de início com base no período selecionado
  const calcularDataInicio = () => {
    const hoje = new Date();
    let dataInicio = new Date();
    
    switch (period) {
      case "30days":
        dataInicio.setDate(hoje.getDate() - 30);
        break;
      case "90days":
        dataInicio.setDate(hoje.getDate() - 90);
        break;
      case "6months":
        dataInicio.setMonth(hoje.getMonth() - 6);
        break;
      case "1year":
        dataInicio.setFullYear(hoje.getFullYear() - 1);
        break;
      default:
        dataInicio.setDate(hoje.getDate() - 90);
    }
    
    return dataInicio.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (empresaAtual?.id) {
      carregarDados();
    }
  }, [empresaAtual, period]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const dataInicio = calcularDataInicio();
      
      // Buscar todos os registros de absenteísmo no período
      const { data: absenteismos, error } = await supabase
        .from('absenteismo')
        .select(`
          id,
          tipo_atestado,
          dias_afastados,
          dt_inicio_atestado,
          dt_fim_atestado,
          cid_principal,
          descricao_cid,
          setor,
          unidade,
          funcionario_id
        `)
        .eq('empresa_id', empresaAtual?.id)
        .gte('dt_inicio_atestado', dataInicio)
        .order('dt_inicio_atestado', { ascending: false });

      if (error) throw error;
      
      // Total de registros e dias perdidos
      const totalAusencias = absenteismos.length;
      const diasPerdidos = absenteismos.reduce((total, item) => total + (item.dias_afastados || 0), 0);
      
      // Funcionários afetados (contagem única)
      const funcionariosUnicos = new Set();
      absenteismos.forEach(item => {
        if (item.funcionario_id) funcionariosUnicos.add(item.funcionario_id);
      });
      const funcionariosAfetados = funcionariosUnicos.size;
      
      // Buscar total de funcionários da empresa para calcular taxa
      const { data: totalFuncionarios, error: errorFuncionarios } = await supabase
        .from('funcionarios')
        .select('id')
        .eq('empresa_id', empresaAtual?.id);
        
      if (errorFuncionarios) throw errorFuncionarios;
        
      // Calcular taxa de absenteísmo
      const totalFuncs = totalFuncionarios.length;
      const taxaAbsenteismo = totalFuncs > 0 ? (funcionariosAfetados / totalFuncs) * 100 : 0;
      
      // Processar tendência mensal
      const tendenciaPorMes = obterTendenciaMensal(absenteismos);
      
      // Processar distribuição por tipo
      const tiposAbsenteismo = processarTiposAbsenteismo(absenteismos);
      
      // Processar departamentos
      const departamentos = processarDepartamentos(absenteismos);
      
      // Processar top CIDs
      const topCids = processarTopCids(absenteismos);
      
      setDados({
        totalAusencias,
        diasPerdidos,
        funcionariosAfetados,
        taxaAbsenteismo,
        tendenciaMensal: tendenciaPorMes,
        distribuicaoTipos: tiposAbsenteismo,
        departamentos,
        topCids
      });
      
    } catch (error) {
      console.error("Erro ao carregar dados de absenteísmo:", error);
      toast.error("Erro ao carregar dados de absenteísmo");
    } finally {
      setLoading(false);
    }
  };

  // Função para processar a tendência mensal
  const obterTendenciaMensal = (absenteismos: any[]) => {
    const meses: {[key: string]: {days: number, count: number}} = {};
    const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    // Inicializar últimos 6 meses
    const hoje = new Date();
    for (let i = 5; i >= 0; i--) {
      const mesIndex = (hoje.getMonth() - i + 12) % 12;
      const ano = hoje.getFullYear() - (hoje.getMonth() < i ? 1 : 0);
      const chave = `${ano}-${mesIndex+1}`;
      meses[chave] = { days: 0, count: 0, name: nomesMeses[mesIndex] };
    }
    
    // Preencher com dados reais
    absenteismos.forEach(item => {
      if (!item.dt_inicio_atestado) return;
      
      const data = new Date(item.dt_inicio_atestado);
      const chave = `${data.getFullYear()}-${data.getMonth()+1}`;
      
      if (meses[chave]) {
        meses[chave].count += 1;
        meses[chave].days += (item.dias_afastados || 0);
      }
    });
    
    // Converter para array e ordenar por mês
    return Object.values(meses);
  };

  // Função para processar distribuição por tipo de absenteísmo
  const processarTiposAbsenteismo = (absenteismos: any[]) => {
    const contagem = {
      1: 0, // Atestado médico
      2: 0, // Licença maternidade
      3: 0, // Acidente de trabalho
      4: 0  // Outros afastamentos
    };
    
    absenteismos.forEach(item => {
      const tipo = item.tipo_atestado || 1;
      contagem[tipo as keyof typeof contagem] += 1;
    });
    
    return [
      { name: "Licença Médica", value: contagem[1], color: cores.licencaMedica },
      { name: "Licença Maternidade", value: contagem[2], color: cores.licencaMaternidade },
      { name: "Acidente de Trabalho", value: contagem[3], color: cores.acidenteTrabalho },
      { name: "Outras Ausências", value: contagem[4], color: cores.outrosAfastamentos }
    ];
  };

  // Função para processar dados por departamento
  const processarDepartamentos = (absenteismos: any[]) => {
    const departamentos: {[key: string]: {days: number, count: number}} = {};
    
    absenteismos.forEach(item => {
      const setor = item.setor || "Não especificado";
      
      if (!departamentos[setor]) {
        departamentos[setor] = { days: 0, count: 0, name: setor };
      }
      
      departamentos[setor].count += 1;
      departamentos[setor].days += (item.dias_afastados || 0);
    });
    
    // Converter para array e ordenar por dias/contagem (dependendo da métrica)
    return Object.values(departamentos)
      .sort((a, b) => metric === "days" ? b.days - a.days : b.count - a.count)
      .slice(0, 5); // Top 5 departamentos
  };

  // Função para processar top CIDs
  const processarTopCids = (absenteismos: any[]) => {
    const cids: {[key: string]: {value: number, desc: string}} = {};
    
    absenteismos.forEach(item => {
      if (!item.cid_principal) return;
      
      const cid = item.cid_principal;
      const desc = item.descricao_cid || "Não especificado";
      
      if (!cids[cid]) {
        cids[cid] = { value: 0, desc, name: `${cid} - ${desc}` };
      }
      
      cids[cid].value += 1;
    });
    
    // Converter para array, ordenar e pegar os 5 mais frequentes
    const coresDisponiveis = [cores.cid1, cores.cid2, cores.cid3, cores.cid4, cores.cid5];
    
    return Object.values(cids)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map((cid, index) => ({
        ...cid,
        color: coresDisponiveis[index]
      }));
  };

  // Calcular média de dias por ausência
  const mediaDiasPorAusencia = dados.totalAusencias > 0 
    ? (dados.diasPerdidos / dados.totalAusencias).toFixed(1) 
    : "0";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Análise de Absenteísmo</h1>
        <p className="text-muted-foreground">
          Acompanhe e analise ausências de funcionários e tendências de saúde
        </p>
      </div>

      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center space-x-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30days">Últimos 30 Dias</SelectItem>
              <SelectItem value="90days">Últimos 90 Dias</SelectItem>
              <SelectItem value="6months">Últimos 6 Meses</SelectItem>
              <SelectItem value="1year">Último Ano</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="gap-1">
            <Filter className="h-4 w-4" />
            Mais Filtros
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
        
        <Tabs value={metric} onValueChange={setMetric} className="w-[400px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="days">Dias</TabsTrigger>
            <TabsTrigger value="count">Ocorrências</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando dados...</span>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Ausências</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dados.totalAusencias}</div>
                <p className="text-xs text-muted-foreground">
                  Para o período selecionado
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dias Perdidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dados.diasPerdidos}</div>
                <p className="text-xs text-muted-foreground">
                  Média de {mediaDiasPorAusencia} dias por ausência
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Funcionários Afetados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dados.funcionariosAfetados}</div>
                <p className="text-xs text-muted-foreground">
                  Com pelo menos um afastamento
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Absenteísmo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dados.taxaAbsenteismo.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Percentual de funcionários afetados
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tendência Mensal</CardTitle>
                <CardDescription>
                  Tendência de ausências nos últimos meses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dados.tendenciaMensal}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey={metric === "days" ? "days" : "count"} fill="#0ea5e9" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Ausências por Tipo</CardTitle>
                <CardDescription>
                  Distribuição de ausências por categoria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dados.distribuicaoTipos}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => 
                          percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ""
                        }
                      >
                        {dados.distribuicaoTipos.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ausências por Departamento</CardTitle>
                <CardDescription>
                  Distribuição de ausências por departamentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dados.departamentos} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey={metric === "days" ? "days" : "count"} fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top 5 Causas CID</CardTitle>
                <CardDescription>
                  Razões médicas mais comuns para ausências
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dados.topCids}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => 
                          percent > 0 ? `${name.split(' - ')[0]} ${(percent * 100).toFixed(0)}%` : ""
                        }
                      >
                        {dados.topCids.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Absenteismo;
