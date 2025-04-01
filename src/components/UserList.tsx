
import React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertCircle, Pencil, Trash2 } from "lucide-react";

interface Usuario {
  id: string;
  email: string;
  nome: string;
  tipo_usuario: "admin" | "normal";
  empresas: { id: string; nome: string }[];
  telas: { id: string; nome: string; permissao_leitura?: boolean; permissao_escrita?: boolean; permissao_exclusao?: boolean }[];
  ativo: boolean;
}

interface UserListProps {
  usuarios: Usuario[];
  filteredUsers: Usuario[];
  isLoading: boolean;
  loadError: string | null;
  handleEditUser: (user: Usuario) => void;
  handleDeleteUser: (id: string) => void;
  handleReload: () => void;
}

export const UserList: React.FC<UserListProps> = ({ 
  usuarios, 
  filteredUsers, 
  isLoading, 
  loadError, 
  handleEditUser, 
  handleDeleteUser,
  handleReload 
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sidebar-accent"></div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="text-center py-6 border rounded-md p-4 bg-destructive/10 text-destructive">
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        <h3 className="font-semibold mb-2">Erro ao carregar usuários</h3>
        <p>{loadError}</p>
        <p className="text-sm mt-4">
          Verifique se as Edge Functions estão corretamente implantadas no Supabase
          e se as variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão configuradas.
        </p>
        <Button 
          onClick={handleReload}
          variant="outline"
          className="mt-4"
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (usuarios.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p>Nenhum usuário encontrado. Use funções Edge para administração de usuários.</p>
        <p className="text-sm mt-2">Esta funcionalidade requer configuração de Edge Functions no Supabase.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Empresas</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                Nenhum usuário encontrado com o termo de busca
              </TableCell>
            </TableRow>
          ) : (
            filteredUsers.map((usuario) => (
              <TableRow key={usuario.id}>
                <TableCell className="font-medium">{usuario.nome}</TableCell>
                <TableCell>{usuario.email}</TableCell>
                <TableCell>
                  {usuario.tipo_usuario === "admin" ? "Administrador" : "Usuário Normal"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    {usuario.empresas.length > 0 ? (
                      usuario.empresas.map((emp) => (
                        <span key={emp.id} className="text-sm">
                          {emp.nome}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">Sem empresas vinculadas</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEditUser(usuario)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDeleteUser(usuario.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Excluir</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
