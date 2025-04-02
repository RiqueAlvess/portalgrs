import React, { useState, useEffect } from "react";
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
import { Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
  const [empresasSearch, setEmpresasSearch] = useState("");
  const [filteredEmpresas, setFilteredEmpresas] = useState<Empresa[]>(empresas);
  const [telasSearch, setTelasSearch] = useState("");
  const [filteredTelas, setFilteredTelas] = useState<Tela[]>(telas);
  const [selectAllEnabled, setSelectAllEnabled] = useState(true);

  useEffect(() => {
    if (empresas.length > 0) {
      if (!empresasSearch) {
        setFilteredEmpresas(empresas);
      } else {
        const searchTerm = empresasSearch.toLowerCase();
        const filtered = empresas.filter(
          empresa => 
            empresa.nome.toLowerCase().includes(searchTerm) || 
            empresa.cnpj.toLowerCase().includes(searchTerm)
        );
        setFilteredEmpresas(filtered);
      }
    }
  }, [empresasSearch, empresas]);

  useEffect(() => {
    if (telas.length > 0) {
      if (!telasSearch) {
        setFilteredTelas(telas);
      } else {
        const searchTerm = telasSearch.toLowerCase();
        const filtered = telas.filter(
          tela => 
            tela.nome.toLowerCase().includes(searchTerm) || 
            tela.codigo.toLowerCase().includes(searchTerm)
        );
        setFilteredTelas(filtered);
      }
    }
  }, [telasSearch, telas]);

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

  const selectAllEmpresas = () => {
    if (filteredEmpresas.length > 500 && selectAllEnabled) {
      setSelectAllEnabled(false);
      toast.warning("Muitas empresas para selecionar de uma vez (mais de 500). Refine sua busca.");
      return;
    }
    
    setFormData({
      ...formData,
      empresasVinculadas: filteredEmpresas.map(empresa => empresa.id)
    });
    toast.success(`${filteredEmpresas.length} empresas selecionadas`);
  };

  const unselectAllEmpresas = () => {
    setFormData({
      ...formData,
      empresasVinculadas: []
    });
    toast.success("Todas as empresas foram desmarcadas");
  };

  const selectAllTelaPermissions = (type: 'permissao_leitura' | 'permissao_escrita' | 'permissao_exclusao') => {
    setFormData(prev => {
      const newTelasVinculadas = [...prev.telasVinculadas];
      
      filteredTelas.forEach(tela => {
        const telaIndex = newTelasVinculadas.findIndex(t => t.id === tela.id);
        
        if (telaIndex >= 0) {
          newTelasVinculadas[telaIndex] = {
            ...newTelasVinculadas[telaIndex],
            [type]: true,
            ...(type !== 'permissao_leitura' ? { permissao_leitura: true } : {})
          };
        }
      });
      
      return {
        ...prev,
        telasVinculadas: newTelasVinculadas
      };
    });
    
    toast.success(`Permissão de ${type === 'permissao_leitura' ? 'leitura' : type === 'permissao_escrita' ? 'escrita' : 'exclusão'} concedida para todas as telas`);
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
          onValueChange={(value: "admin" | "normal") => setFormData({...formData, tipoUsuario: value})}
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
            <div className="border rounded-md p-2">
              <div className="sticky top-0 bg-white border-b pb-2 mb-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar empresas..." 
                    className="w-full pl-8"
                    value={empresasSearch}
                    onChange={(e) => setEmpresasSearch(e.target.value)}
                  />
                  {empresasSearch && (
                    <button
                      onClick={() => setEmpresasSearch("")}
                      className="absolute right-2.5 top-2.5"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
                <div className="flex justify-between mt-2 flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground pt-1">
                    {filteredEmpresas.length} empresas encontradas
                  </span>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllEmpresas}
                      disabled={filteredEmpresas.length === 0 || !selectAllEnabled}
                      title={!selectAllEnabled ? "Muitas empresas para selecionar de uma vez. Refine sua busca." : ""}
                    >
                      Selecionar todas
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={unselectAllEmpresas}
                      disabled={formData.empresasVinculadas.length === 0}
                    >
                      Limpar seleção
                    </Button>
                  </div>
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {filteredEmpresas.length === 0 ? (
                  <div className="py-4 text-center text-muted-foreground">
                    Nenhuma empresa encontrada com o termo de busca
                  </div>
                ) : (
                  filteredEmpresas.map((empresa) => (
                    <div key={empresa.id} className="flex items-center space-x-2 py-1 hover:bg-muted/50 px-2 rounded">
                      <Checkbox
                        id={`empresa-${empresa.id}`}
                        checked={formData.empresasVinculadas.includes(empresa.id)}
                        onCheckedChange={() => toggleEmpresa(empresa.id)}
                      />
                      <Label htmlFor={`empresa-${empresa.id}`} className="cursor-pointer text-sm flex-1">
                        {empresa.nome} <span className="text-xs text-muted-foreground">({empresa.cnpj})</span>
                      </Label>
                    </div>
                  ))
                )}
              </div>
              <div className="pt-2 text-center text-sm text-muted-foreground">
                {formData.empresasVinculadas.length} empresas selecionadas
              </div>
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
            <div className="border rounded-md overflow-hidden">
              <div className="p-2 border-b">
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar telas..." 
                    className="w-full pl-8"
                    value={telasSearch}
                    onChange={(e) => setTelasSearch(e.target.value)}
                  />
                  {telasSearch && (
                    <button
                      onClick={() => setTelasSearch("")}
                      className="absolute right-2.5 top-2.5"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
                <div className="flex justify-between flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground pt-1">
                    {filteredTelas.length} telas encontradas
                  </span>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => selectAllTelaPermissions('permissao_leitura')}
                      disabled={filteredTelas.length === 0}
                    >
                      Dar leitura para todas
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => selectAllTelaPermissions('permissao_escrita')}
                      disabled={filteredTelas.length === 0}
                    >
                      Dar escrita para todas
                    </Button>
                  </div>
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted">
                    <TableRow>
                      <TableHead>Tela</TableHead>
                      <TableHead className="text-center">Leitura</TableHead>
                      <TableHead className="text-center">Escrita</TableHead>
                      <TableHead className="text-center">Exclusão</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTelas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                          Nenhuma tela encontrada com o termo de busca
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTelas.map((tela) => {
                        const telaVinculada = formData.telasVinculadas.find(t => t.id === tela.id);
                        const leitura = telaVinculada?.permissao_leitura ?? false;
                        const escrita = telaVinculada?.permissao_escrita ?? false;
                        const exclusao = telaVinculada?.permissao_exclusao ?? false;
                        
                        return (
                          <TableRow key={tela.id}>
                            <TableCell>
                              <div>
                                {tela.nome}
                                <span className="block text-xs text-muted-foreground">
                                  {tela.codigo}
                                </span>
                              </div>
                            </TableCell>
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
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
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
