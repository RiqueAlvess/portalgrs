
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
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
  X
} from "lucide-react";

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navigation = [
    { name: "Dashboard", path: "/", icon: <LayoutDashboard className="h-5 w-5" /> },
    { name: "Employees", path: "/employees", icon: <Users className="h-5 w-5" /> },
    { name: "Absenteeism", path: "/absenteeism", icon: <Calendar className="h-5 w-5" /> },
    { name: "Medical Exams", path: "/medical-exams", icon: <FileText className="h-5 w-5" /> },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile menu button */}
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

      {/* Sidebar - Desktop always visible, mobile conditionally */}
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

            <div className="px-4 mb-6">
              <Card className="p-4 bg-sidebar-accent border-none">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">{user?.name}</span>
                  <span className="text-xs text-gray-200">{user?.email}</span>
                  <div className="flex items-center mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-sidebar-accent hover:text-white w-full justify-start px-2"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <main className="p-4 md:p-8">
          <Outlet />
        </main>
      </div>

      {/* Backdrop for mobile - closes menu when clicked */}
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
