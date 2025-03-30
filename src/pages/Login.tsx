
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Building, MailIcon, KeyIcon } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Login = () => {
  const [email, setEmail] = useState("admin@exemplo.com");
  const [password, setPassword] = useState("senha123");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirecionar se já estiver autenticado
  if (isAuthenticated) {
    navigate("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    
    if (!email || !password) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("Tentando login com:", { email, password });
      const success = await login(email, password);
      
      if (success) {
        navigate("/");
      } else {
        console.log("Login falhou mas não lançou erro");
        setLoginError("Credenciais inválidas. Verifique seu email e senha.");
      }
    } catch (error: any) {
      console.error("Erro detalhado de login:", error);
      
      // Exibir mensagem mais específica baseada no erro
      if (error?.message?.includes("Invalid login credentials")) {
        setLoginError("Credenciais inválidas. O email ou senha estão incorretos.");
      } else {
        setLoginError(`Erro: ${error?.message || "Ocorreu um problema ao tentar fazer login"}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-4 sm:p-6 lg:p-8">
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-sidebar-accent">
                <Building className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Portal GRS</CardTitle>
            <CardDescription className="text-center">
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {loginError && (
                <Alert variant="destructive" className="text-sm bg-red-50 text-red-500 border-red-200">
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}
              
              <Card className="bg-blue-50 border-blue-200 p-4">
                <p className="text-sm text-blue-700 font-medium mb-2">Para testes, use estas credenciais:</p>
                <div className="flex items-center mt-1 text-sm text-blue-600">
                  <MailIcon className="h-4 w-4 mr-1" /> admin@exemplo.com
                </div>
                <div className="flex items-center mt-1 text-sm text-blue-600">
                  <KeyIcon className="h-4 w-4 mr-1" /> senha123
                </div>
                <p className="text-xs text-blue-500 mt-2">
                  Nota: Se essas credenciais não funcionarem, tente criar uma conta no Supabase Auth.
                </p>
              </Card>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full bg-sidebar-accent hover:bg-sidebar-accent/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Entrando..." : "Entrar"}
              </Button>
              <div className="text-gray-500 text-sm text-center px-4">
                <p>Para acesso ao sistema, entre em contato com o administrador.</p>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
