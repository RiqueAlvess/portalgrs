
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Building,
  LogOut,
  Menu,
  X,
  UserCog,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const Layout = () => {
  const { user, perfil, empresas, empresaAtual, logout, mudarEmpresa } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [navigation, setNavigation] = useState([
    { name: "Dashboard", path: "/", icon: <LayoutDashboard className="h-5 w-5" /> },
    { name: "Funcionários", path: "/employees", icon: <Users className="h-5 w-5" /> },
    { name: "Absenteísmo", path: "/absenteeism", icon: <Calendar className="h-5 w-5" /> },
    { name: "Exames Médicos", path: "/medical-exams", icon: <FileText className="h-5 w-5" /> },
  ]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleEmpresaChange = (empresaId: string) => {
    const empresa = empresas.find(emp => emp.id === empresaId);
    if (empresa) {
      mudarEmpresa(empresa);
    }
  };

  // Atualizar a navegação sempre que o perfil ou os metadados do usuário mudarem
  useEffect(() => {
    const baseNavigation = [
      { name: "Dashboard", path: "/", icon: <LayoutDashboard className="h-5 w-5" /> },
      { name: "Funcionários", path: "/employees", icon: <Users className="h-5 w-5" /> },
      { name: "Absenteísmo", path: "/absenteeism", icon: <Calendar className="h-5 w-5" /> },
      { name: "Exames Médicos", path: "/medical-exams", icon: <FileText className="h-5 w-5" /> },
    ];

    // Verificação direta dos metadados do usuário
    const isAdmin = user?.user_metadata?.tipo_usuario === 'admin' || perfil?.tipo_usuario === 'admin';
    
    if (isAdmin) {
      console.log("Usuário admin detectado, adicionando menu de Usuários");
      baseNavigation.push({ name: "Usuários", path: "/users", icon: <UserCog className="h-5 w-5" /> });
      toast.success("Bem-vindo, Administrador!");
    } else {
      console.log("Usuário normal detectado, tipo:", 
        user?.user_metadata?.tipo_usuario || perfil?.tipo_usuario || 'desconhecido');
    }

    // Imprimir logs detalhados para ajudar na depuração
    console.log("Metadados do usuário:", user?.user_metadata);
    console.log("Perfil do usuário:", perfil);

    setNavigation(baseNavigation);
  }, [user, perfil]);

  // Função para obter o texto do tipo de usuário
  const getUserTypeText = (type: string | undefined) => {
    // Verificar diretamente dos metadados do usuário, com fallback para o perfil
    const userType = user?.user_metadata?.tipo_usuario || type;
    if (userType === "admin") return "Administrador";
    return "Usuário";
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Botão do menu mobile */}
      <div className="fixed top-0 left-0 z-40 p-4 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar - Desktop sempre visível, mobile condicional */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-sidebar transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-center h-16 px-4 bg-sidebar-accent">
            <div className="flex items-center space-x-2">
              <Building className="h-8 w-8 text-white" />
              <span className="text-xl font-bold text-white">Portal GRS</span>
            </div>
          </div>

          <div className="flex flex-col justify-between h-full overflow-y-auto py-4">
            <div className="px-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center px-4 py-3 text-sm rounded-md transition-colors ${
                    location.pathname === item.path
                      ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </Link>
              ))}
            </div>

            <div className="px-4 space-y-4 mb-6">
              {/* Seletor de Empresa */}
              <div className="px-4">
                <p className="text-xs text-gray-200 mb-1">Empresa Atual</p>
                <Select 
                  value={empresaAtual?.id} 
                  onValueChange={handleEmpresaChange}
                >
                  <SelectTrigger className="w-full bg-sidebar-accent text-white border-none">
                    <SelectValue placeholder="Selecione uma empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map((empresa) => (
                      <SelectItem key={empresa.id} value={empresa.id}>
                        {empresa.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Card do usuário */}
              <Card className="p-4 bg-sidebar-accent border-none">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">{perfil?.nome}</span>
                  <span className="text-xs text-gray-200">{getUserTypeText(perfil?.tipo_usuario)}</span>
                  <div className="flex items-center mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-sidebar-accent hover:text-white w-full justify-start px-2"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-auto">
        <main className="p-4 md:p-8">
          <Outlet />
        </main>
      </div>

      {/* Backdrop para mobile - fecha o menu quando clicado */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
