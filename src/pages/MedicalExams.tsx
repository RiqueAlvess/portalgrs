
import { useState } from "react";
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

// Mock data for charts
const statusData = [
  { name: "Overdue", value: 68, color: "#dc2626" },
  { name: "Due Soon", value: 124, color: "#f97316" },
  { name: "Scheduled", value: 45, color: "#0ea5e9" },
  { name: "Completed", value: 287, color: "#10b981" },
];

// Mock data for employees
const mockEmployees = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  code: 1000 + i,
  name: `Employee ${1000 + i}`,
  department: ["HR", "IT", "Finance", "Operations", "Sales"][Math.floor(Math.random() * 5)],
  overdueExams: Math.floor(Math.random() * 3),
  dueExams: Math.floor(Math.random() * 3),
  scheduledExams: Math.floor(Math.random() * 2),
  completedExams: Math.floor(1 + Math.random() * 5),
  exams: Array.from({ length: 3 + Math.floor(Math.random() * 5) }, (_, j) => ({
    id: j + 1,
    name: ["Annual Checkup", "Hearing Test", "Vision Test", "Ergonomic Assessment", "Respiratory Test", "Blood Test"][Math.floor(Math.random() * 6)],
    dueDate: new Date(Date.now() + (Math.random() * 90 - 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: ["Overdue", "Due Soon", "Scheduled", "Completed"][Math.floor(Math.random() * 4)],
    lastCompleted: j % 3 === 0 ? null : new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  })),
}));

const MedicalExams = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredEmployees = mockEmployees.filter(
    (employee) =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.code.toString().includes(searchTerm)
  );

  const handleRowClick = (employee: any) => {
    setSelectedEmployee(employee);
    setIsDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Overdue":
        return "destructive";
      case "Due Soon":
        return "warning";
      case "Scheduled":
        return "default";
      case "Completed":
        return "success";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Medical Examinations</h1>
        <p className="text-muted-foreground">
          Monitor and manage employee medical examinations and health assessments
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68</div>
            <p className="text-xs text-muted-foreground">
              13% of total exams
            </p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">124</div>
            <p className="text-xs text-muted-foreground">
              Next 30 days
            </p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">
              Appointments booked
            </p>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">287</div>
            <p className="text-xs text-muted-foreground">
              56% of total exams
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Exam Status Distribution</CardTitle>
            <CardDescription>
              Overview of all exam statuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
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
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Employee Exam Summary</CardTitle>
            <CardDescription>
              View status of employee medical examinations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search employee..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="due">Due Soon</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead className="text-center">Overdue</TableHead>
                      <TableHead className="text-center">Due Soon</TableHead>
                      <TableHead className="text-center">Scheduled</TableHead>
                      <TableHead className="text-center">Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((employee) => (
                      <TableRow 
                        key={employee.id} 
                        className="cursor-pointer"
                        onClick={() => handleRowClick(employee)}
                      >
                        <TableCell className="font-medium">{employee.name}</TableCell>
                        <TableCell className="text-center">
                          {employee.overdueExams > 0 && (
                            <Badge variant="destructive">{employee.overdueExams}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {employee.dueExams > 0 && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                              {employee.dueExams}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {employee.scheduledExams > 0 && (
                            <Badge>{employee.scheduledExams}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {employee.completedExams > 0 && (
                            <Badge variant="outline">{employee.completedExams}</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Exams Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Employee Medical Exams</DialogTitle>
            <DialogDescription>Detailed exam information for {selectedEmployee?.name}</DialogDescription>
          </DialogHeader>
          
          {selectedEmployee && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="flex items-center justify-center bg-muted rounded-full p-4">
                  <User className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold">{selectedEmployee.name}</h3>
                  <p className="text-muted-foreground">{selectedEmployee.department}</p>
                  <p className="text-sm">Code: {selectedEmployee.code}</p>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exam</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedEmployee.exams.map((exam: any) => (
                      <TableRow key={exam.id}>
                        <TableCell className="font-medium">{exam.name}</TableCell>
                        <TableCell>{exam.dueDate}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(exam.status) as any}>
                            {exam.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{exam.lastCompleted || "Never"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">Schedule Exams</Button>
                <Button>Export Data</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MedicalExams;
