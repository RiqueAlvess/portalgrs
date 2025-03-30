
import { useState } from "react";
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

// Mock employee data
const mockEmployees = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  code: 1000 + i,
  name: `Employee ${1000 + i}`,
  department: ["HR", "IT", "Finance", "Operations", "Sales"][Math.floor(Math.random() * 5)],
  position: ["Manager", "Analyst", "Assistant", "Director", "Coordinator"][Math.floor(Math.random() * 5)],
  status: ["Active", "Inactive", "On Leave", "On Vacation"][Math.floor(Math.random() * 4)],
  cpf: `${Math.floor(100000000 + Math.random() * 900000000)}-${Math.floor(10 + Math.random() * 90)}`,
  email: `employee${1000 + i}@example.com`,
  phone: `(${Math.floor(10 + Math.random() * 90)}) ${Math.floor(10000 + Math.random() * 90000)}-${Math.floor(1000 + Math.random() * 9000)}`,
  hireDate: new Date(2020 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 12), Math.floor(1 + Math.random() * 28)).toISOString().split('T')[0],
}));

const Employees = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<null | any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredEmployees = mockEmployees.filter(
    (employee) =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.cpf.includes(searchTerm) ||
      employee.code.toString().includes(searchTerm)
  );

  const handleRowClick = (employee: any) => {
    setSelectedEmployee(employee);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
        <p className="text-muted-foreground">
          Manage your workforce information and employee records
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Records</CardTitle>
          <CardDescription>
            View and manage detailed information about your employees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name, CPF or code..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Department</TableHead>
                    <TableHead className="hidden md:table-cell">Position</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow 
                      key={employee.id} 
                      className="cursor-pointer"
                      onClick={() => handleRowClick(employee)}
                    >
                      <TableCell>{employee.code}</TableCell>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell className="hidden md:table-cell">{employee.department}</TableCell>
                      <TableCell className="hidden md:table-cell">{employee.position}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            employee.status === "Active" 
                            ? "default" 
                            : employee.status === "Inactive" 
                            ? "destructive" 
                            : "secondary"
                          }
                        >
                          {employee.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
            <DialogDescription>Detailed information about the selected employee</DialogDescription>
          </DialogHeader>
          
          {selectedEmployee && (
            <Tabs defaultValue="personal">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal">Personal Info</TabsTrigger>
                <TabsTrigger value="employment">Employment</TabsTrigger>
                <TabsTrigger value="health">Health Records</TabsTrigger>
              </TabsList>
              <TabsContent value="personal" className="space-y-4 pt-4">
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  <div className="flex items-center justify-center bg-muted rounded-full p-6">
                    <User className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold">{selectedEmployee.name}</h3>
                    <p className="text-muted-foreground">{selectedEmployee.position}</p>
                    <Badge 
                      variant={
                        selectedEmployee.status === "Active" 
                        ? "default" 
                        : selectedEmployee.status === "Inactive" 
                        ? "destructive" 
                        : "secondary"
                      }
                    >
                      {selectedEmployee.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Employee Code</p>
                    <p className="text-sm text-muted-foreground">{selectedEmployee.code}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">CPF</p>
                    <p className="text-sm text-muted-foreground">{selectedEmployee.cpf}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{selectedEmployee.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{selectedEmployee.phone}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="employment" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Department</p>
                    <p className="text-sm text-muted-foreground">{selectedEmployee.department}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Position</p>
                    <p className="text-sm text-muted-foreground">{selectedEmployee.position}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Hire Date</p>
                    <p className="text-sm text-muted-foreground">{selectedEmployee.hireDate}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-sm text-muted-foreground">{selectedEmployee.status}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="health" className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">No health records available for this employee.</p>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Employees;
