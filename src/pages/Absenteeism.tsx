
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, ChevronDown, Filter } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";

// Dados simulados para os gráficos
const monthlyData = [
  { name: "Jan", days: 120, count: 45 },
  { name: "Fev", days: 100, count: 40 },
  { name: "Mar", days: 130, count: 48 },
  { name: "Abr", days: 85, count: 32 },
  { name: "Mai", days: 110, count: 38 },
  { name: "Jun", days: 95, count: 36 },
];

const typeData = [
  { name: "Licença Médica", value: 65, color: "#0ea5e9" },
  { name: "Licença Maternidade", value: 15, color: "#f97316" },
  { name: "Acidente de Trabalho", value: 10, color: "#dc2626" },
  { name: "Outras Ausências", value: 10, color: "#8b5cf6" },
];

const departmentData = [
  { name: "Operações", days: 180, count: 60 },
  { name: "Vendas", days: 120, count: 45 },
  { name: "TI", days: 80, count: 30 },
  { name: "Financeiro", days: 60, count: 25 },
  { name: "RH", days: 40, count: 15 },
];

const topCidData = [
  { name: "A09 - Diarreia", value: 25, color: "#0ea5e9" },
  { name: "R51 - Dor de cabeça", value: 20, color: "#8b5cf6" },
  { name: "J11 - Influenza", value: 18, color: "#f97316" },
  { name: "M54 - Dor nas costas", value: 15, color: "#10b981" },
  { name: "J03 - Amigdalite", value: 12, color: "#dc2626" },
];

const Absenteeism = () => {
  const [period, setPeriod] = useState("90days");
  const [metric, setMetric] = useState("days");

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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Ausências</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">241</div>
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
            <div className="text-2xl font-bold">640</div>
            <p className="text-xs text-muted-foreground">
              Média de 2,7 dias por ausência
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funcionários Afetados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">
              12,6% do total de funcionários
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Absenteísmo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,5%</div>
            <p className="text-xs text-muted-foreground">
              Aumento de 1,2% do período anterior
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tendência Mensal</CardTitle>
            <CardDescription>
              Tendência de ausências nos últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
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
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {typeData.map((entry, index) => (
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
                <BarChart data={departmentData} layout="vertical">
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
                    data={topCidData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name.split(' - ')[0]} ${(percent * 100).toFixed(0)}%`}
                  >
                    {topCidData.map((entry, index) => (
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
    </div>
  );
};

export default Absenteeism;
