
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, ChevronDown, Filter } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";

// Mock data for charts
const monthlyData = [
  { name: "Jan", days: 120, count: 45 },
  { name: "Feb", days: 100, count: 40 },
  { name: "Mar", days: 130, count: 48 },
  { name: "Apr", days: 85, count: 32 },
  { name: "May", days: 110, count: 38 },
  { name: "Jun", days: 95, count: 36 },
];

const typeData = [
  { name: "Medical Leave", value: 65, color: "#0ea5e9" },
  { name: "Parental Leave", value: 15, color: "#f97316" },
  { name: "Work Accident", value: 10, color: "#dc2626" },
  { name: "Other Absences", value: 10, color: "#8b5cf6" },
];

const departmentData = [
  { name: "Operations", days: 180, count: 60 },
  { name: "Sales", days: 120, count: 45 },
  { name: "IT", days: 80, count: 30 },
  { name: "Finance", days: 60, count: 25 },
  { name: "HR", days: 40, count: 15 },
];

const topCidData = [
  { name: "A09 - Diarrhea", value: 25, color: "#0ea5e9" },
  { name: "R51 - Headache", value: 20, color: "#8b5cf6" },
  { name: "J11 - Influenza", value: 18, color: "#f97316" },
  { name: "M54 - Back pain", value: 15, color: "#10b981" },
  { name: "J03 - Tonsillitis", value: 12, color: "#dc2626" },
];

const Absenteeism = () => {
  const [period, setPeriod] = useState("90days");
  const [metric, setMetric] = useState("days");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Absenteeism Analysis</h1>
        <p className="text-muted-foreground">
          Track and analyze employee absences and health trends
        </p>
      </div>

      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center space-x-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="gap-1">
            <Filter className="h-4 w-4" />
            More Filters
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
        
        <Tabs value={metric} onValueChange={setMetric} className="w-[400px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="days">Days</TabsTrigger>
            <TabsTrigger value="count">Occurrences</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Absences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">241</div>
            <p className="text-xs text-muted-foreground">
              For the selected period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Days Lost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">640</div>
            <p className="text-xs text-muted-foreground">
              Avg. 2.7 days per absence
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Affected Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">
              12.6% of total workforce
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absenteeism Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.5%</div>
            <p className="text-xs text-muted-foreground">
              1.2% increase from last period
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
            <CardDescription>
              Absence trend over the last 6 months
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
            <CardTitle>Absence by Type</CardTitle>
            <CardDescription>
              Distribution of absences by category
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
            <CardTitle>Absence by Department</CardTitle>
            <CardDescription>
              Breakdown of absences across departments
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
            <CardTitle>Top 5 CID Causes</CardTitle>
            <CardDescription>
              Most common medical reasons for absence
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
