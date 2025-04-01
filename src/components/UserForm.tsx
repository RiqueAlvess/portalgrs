
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";

interface Tela {
  id: string;
  nome: string;
  codigo: string;
  descricao: string | null;
}

interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
}

interface FormData {
  nome: string;
  email: string;
  senha: string;
  tipoUsuario: "admin" | "normal";
  empresasVinculadas: string[];
  telasVinculadas: {
    id: string; 
    permissao_leitura: boolean; 
    permissao_escrita: boolean; 
    permissao_exclusao: boolean;
  }[];
  ativo: boolean;
}

interface UserFormProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  empresas: Empresa[];
  telas: Tela[];
  isAddingUser: boolean;
  loadingEmpresas: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({ 
  formData, 
  setFormData, 
  empresas, 
  telas, 
  isAddingUser,
  loadingEmpresas 
}) => {
  const toggleEmpresa = (empresaId: string) => {
    setFormData(prev => {
      if (prev.empresasVinculadas.includes(empresaId)) {
        return {
          ...prev,
          empresasVinculadas: prev.empresasVinculadas.filter(id => id !== empresaId)
        };
      } else {
        return {
          ...prev,
          empresasVinculadas: [...prev.empresasVinculadas, empresaId]
        };
      }
    });
  };

  const updateTelaPermission = (telaId: string, permissionType: 'permissao_leitura' | 'permissao_escrita' | 'permissao_exclusao', value: boolean) => {
    setFormData(prev => {
      const newTelasVinculadas = [...prev.telasVinculadas];
      const telaIndex = newTelasVinculadas.findIndex(t => t.id === telaId);
      
      if (telaIndex >= 0) {
        newTelasVinculadas[telaIndex] = {
          ...newTelasVinculadas[telaIndex],
          [permissionType]: value
        };
        
        if (permissionType === 'permissao_leitura' && !value) {
          newTelasVinculadas[telaIndex].permissao_escrita = false;
          newTelasVinculadas[telaIndex].permissao_exclusao = false;
        }
        
        if ((permissionType === 'permissao_escrita' || permissionType === 'permissao_exclusao') && value) {
          newTelasVinculadas[telaIndex].permissao_leitura = true;
        }
      }
      
      return {
        ...prev,
        telasVinculadas: newTelasVinculadas
      };
    });
  };

  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="nome" className="text-right">
          Nome
        </Label>
        <Input
          id="nome"
          value={formData.nome}
          onChange={(e) => setFormData({...formData, nome: e.target.value})}
          className="col-span-3"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="email" className="text-right">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          className="col-span-3"
          disabled={!isAddingUser}
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="senha" className="text-right">
          Senha
        </Label>
        <Input
          id="senha"
          type="password"
          placeholder={isAddingUser ? "" : "Deixe em branco para manter a mesma"}
          value={formData.senha}
          onChange={(e) => setFormData({...formData, senha: e.target.value})}
          className="col-span-3"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="tipoUsuario" className="text-right">
          Tipo de Usuário
        </Label>
        <Select
          value={formData.tipoUsuario}
          onValueChange={(value) => setFormData({...formData, tipoUsuario: value as "admin" | "normal"})}
        >
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Selecione um tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="normal">Usuário Normal</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        <Label className="text-right pt-2">Empresas Vinculadas</Label>
        <div className="col-span-3 space-y-2">
          {loadingEmpresas ? (
            <div className="flex items-center text-muted-foreground">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Carregando empresas...
            </div>
          ) : empresas.length > 0 ? (
            <div className="max-h-60 overflow-y-auto border rounded-md p-2">
              <div className="sticky top-0 bg-white border-b pb-2 mb-2">
                <Input 
                  placeholder="Buscar empresas..." 
                  className="w-full"
                  onChange={(e) => {
                    // Implementação futura: busca local de empresas
                  }}
                />
              </div>
              {empresas.map((empresa) => (
                <div key={empresa.id} className="flex items-center space-x-2 py-1">
                  <Checkbox
                    id={`empresa-${empresa.id}`}
                    checked={formData.empresasVinculadas.includes(empresa.id)}
                    onCheckedChange={() => toggleEmpresa(empresa.id)}
                  />
                  <Label htmlFor={`empresa-${empresa.id}`} className="cursor-pointer text-sm">
                    {empresa.nome} <span className="text-xs text-muted-foreground">({empresa.cnpj})</span>
                  </Label>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground">
              Nenhuma empresa disponível. Verifique a configuração do banco de dados.
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        <Label className="text-right pt-2">Permissões de Telas</Label>
        <div className="col-span-3">
          {telas.length > 0 ? (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tela</TableHead>
                    <TableHead className="text-center">Leitura</TableHead>
                    <TableHead className="text-center">Escrita</TableHead>
                    <TableHead className="text-center">Exclusão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {telas.map((tela) => {
                    const telaVinculada = formData.telasVinculadas.find(t => t.id === tela.id);
                    const leitura = telaVinculada?.permissao_leitura ?? false;
                    const escrita = telaVinculada?.permissao_escrita ?? false;
                    const exclusao = telaVinculada?.permissao_exclusao ?? false;
                    
                    return (
                      <TableRow key={tela.id}>
                        <TableCell>{tela.nome}</TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={leitura}
                            onCheckedChange={(checked) => 
                              updateTelaPermission(tela.id, 'permissao_leitura', !!checked)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={escrita}
                            disabled={!leitura}
                            onCheckedChange={(checked) => 
                              updateTelaPermission(tela.id, 'permissao_escrita', !!checked)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={exclusao}
                            disabled={!leitura}
                            onCheckedChange={(checked) => 
                              updateTelaPermission(tela.id, 'permissao_exclusao', !!checked)
                            }
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-muted-foreground">
              Nenhuma tela disponível. Verifique a configuração do banco de dados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
