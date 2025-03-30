
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Users, AlertCircle, Calendar, FileText, Building } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DashboardCounts {
  totalFuncionarios: number;
  funcionariosAtivos: number;
  emLicenca: number;
  examesPendentes: number;
  proximosExames: number;
}

interface AbsenteismoRecente {
  id: string;
  nome: string;
  tipo: string;
  dias_afastados: number;
  data_inicio: string;
  cid_principal: string;
}

interface ProximoExame {
  id: string;
  nome: string;
  exame: string;
  dias_ate_vencimento: number;
  vencido: boolean;
}

const Dashboard = () => {
  const { perfil, empresaAtual } = useAuth();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<DashboardCounts>({
    totalFuncionarios: 0,
    funcionariosAtivos: 0,
    emLicenca: 0,
    examesPendentes: 0,
    proximosExames: 0
  });
  const [ausenciasRecentes, setAusenciasRecentes] = useState<AbsenteismoRecente[]>([]);
  const [proximosExames, setProximosExames] = useState<ProximoExame[]>([]);

  useEffect(() => {
    if (empresaAtual?.id) {
      carregarDados();
    }
  }, [empresaAtual]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Carrega contagens de funcionários
      const { data: funcionarios, error: errorFuncionarios } = await supabase
        .from('funcionarios')
        .select('id, situacao')
        .eq('empresa_id', empresaAtual?.id);

      if (errorFuncionarios) throw errorFuncionarios;

      const totalFuncionarios = funcionarios.length;
      const funcionariosAtivos = funcionarios.filter(f => f.situacao === 'ATIVO' || f.situacao === 'ativo').length;

      // Carrega absenteísmos ativos
      const today = new Date().toISOString().split('T')[0];
      const { data: absenteismosAtivos, error: errorAbsenteismo } = await supabase
        .from('absenteismo')
        .select('id')
        .eq('empresa_id', empresaAtual?.id)
        .gte('data_fim', today);

      if (errorAbsenteismo) throw errorAbsenteismo;

      // Carrega exames pendentes
      const { data: examesPendentes, error: errorExames } = await supabase
        .from('convocacoes')
        .select('id, refazer')
        .eq('empresa_id', empresaAtual?.id)
        .eq('status', 'PENDENTE');

      if (errorExames) throw errorExames;

      const proximosExames = examesPendentes.filter(e => {
        if (!e.refazer) return false;
        const vencimento = new Date(e.refazer);
        const hoje = new Date();
        const diasAteVencimento = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
        return diasAteVencimento <= 30;
      }).length;

      setCounts({
        totalFuncionarios,
        funcionariosAtivos,
        emLicenca: absenteismosAtivos.length,
        examesPendentes: examesPendentes.length,
        proximosExames
      });

      // Carrega ausências recentes
      const { data: ausencias, error: errorAusenciasRecentes } = await supabase
        .from('absenteismo')
        .select(`
          id, 
          tipo_atestado,
          dias_afastados,
          dt_inicio_atestado,
          cid_principal,
          funcionario_id,
          funcionarios (nome)
        `)
        .eq('empresa_id', empresaAtual?.id)
        .order('dt_inicio_atestado', { ascending: false })
        .limit(5);

      if (errorAusenciasRecentes) throw errorAusenciasRecentes;

      const ausenciasFormatadas = ausencias.map(a => {
        let tipoAtestado = "Licença Médica";
        if (a.tipo_atestado === 2) tipoAtestado = "Licença Maternidade";
        else if (a.tipo_atestado === 3) tipoAtestado = "Acidente de Trabalho";
        else if (a.tipo_atestado === 4) tipoAtestado = "Outros Afastamentos";
        
        return {
          id: a.id,
          nome: a.funcionarios?.nome || "Funcionário não identificado",
          tipo: tipoAtestado,
          dias_afastados: a.dias_afastados || 0,
          data_inicio: a.dt_inicio_atestado,
          cid_principal: a.cid_principal || "N/A"
        };
      });

      setAusenciasRecentes(ausenciasFormatadas);

      // Carrega próximos exames
      const { data: exames, error: errorProximosExames } = await supabase
        .from('convocacoes')
        .select(`
          id,
          exame,
          refazer,
          funcionario_id,
          funcionarios (nome)
        `)
        .eq('empresa_id', empresaAtual?.id)
        .eq('status', 'PENDENTE')
        .order('refazer', { ascending: true })
        .limit(5);

      if (errorProximosExames) throw errorProximosExames;

      const hoje = new Date();
      const examesFormatados = exames
        .filter(e => e.refazer) // Filtra apenas exames com data de refazer
        .map(e => {
          const dataRefazer = new Date(e.refazer);
          const diasAteVencimento = Math.ceil((dataRefazer.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
          
          return {
            id: e.id,
            nome: e.funcionarios?.nome || "Funcionário não identificado",
            exame: e.exame || "Exame Periódico",
            dias_ate_vencimento: diasAteVencimento,
            vencido: diasAteVencimento < 0
          };
        })
        .sort((a, b) => a.dias_ate_vencimento - b.dias_ate_vencimento); // Ordena por proximidade de vencimento

      setProximosExames(examesFormatados);

    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
      toast.error("Erro ao carregar dados do dashboard");
    } finally {
      setLoading(false);
    }
  };

  const formatarPercentual = (valor: number, total: number) => {
    if (total === 0) return "0%";
    return `${((valor / total) * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo, {perfil?.nome}! Aqui está uma visão geral do gerenciamento de saúde ocupacional.
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Empresa Atual Selecionada</AlertTitle>
        <AlertDescription className="flex items-center gap-2">
          <Building className="h-4 w-4" /> {empresaAtual?.nome || "Nenhuma empresa selecionada"}
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : counts.totalFuncionarios}</div>
            <p className="text-xs text-muted-foreground">
              {loading ? "Carregando..." : `${counts.funcionariosAtivos} funcionários ativos`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funcionários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : counts.funcionariosAtivos}</div>
            <p className="text-xs text-muted-foreground">
              {loading ? "Carregando..." : formatarPercentual(counts.funcionariosAtivos, counts.totalFuncionarios) + " do total de funcionários"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Licença</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : counts.emLicenca}</div>
            <p className="text-xs text-muted-foreground">
              {loading ? "Carregando..." : formatarPercentual(counts.emLicenca, counts.totalFuncionarios) + " do total de funcionários"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exames Pendentes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : counts.examesPendentes}</div>
            <p className="text-xs text-muted-foreground">
              {loading ? "Carregando..." : `${counts.proximosExames} vencem em 30 dias`}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Ausências Recentes</CardTitle>
            <CardDescription>
              Ausências registradas recentemente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <p className="text-center py-4 text-muted-foreground">Carregando ausências...</p>
              ) : ausenciasRecentes.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">Nenhuma ausência recente encontrada</p>
              ) : (
                ausenciasRecentes.map((ausencia) => (
                  <div key={ausencia.id} className="flex items-center gap-4 rounded-lg border p-3">
                    <div className="flex-1">
                      <div className="font-medium">{ausencia.nome}</div>
                      <div className="text-sm text-muted-foreground">{ausencia.tipo} • {ausencia.dias_afastados} dias</div>
                    </div>
                    <div className="text-sm text-right">
                      <div>Início: {new Date(ausencia.data_inicio).toLocaleDateString()}</div>
                      <div className="font-medium text-muted-foreground">CID: {ausencia.cid_principal}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Próximos Exames Médicos</CardTitle>
            <CardDescription>
              Exames que vencem nos próximos dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <p className="text-center py-4 text-muted-foreground">Carregando exames...</p>
              ) : proximosExames.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">Nenhum exame pendente encontrado</p>
              ) : (
                proximosExames.map((exame) => (
                  <div key={exame.id} className="flex items-center gap-4 rounded-lg border p-3">
                    <div className="flex-1">
                      <div className="font-medium">{exame.nome}</div>
                      <div className="text-sm text-muted-foreground">{exame.exame}</div>
                    </div>
                    <div className="text-sm">
                      <div className={`font-medium ${exame.vencido ? "text-red-500" : ""}`}>
                        Vence: {exame.vencido ? "Atrasado" : `Em ${exame.dias_ate_vencimento} dias`}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
