export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      absenteismo: {
        Row: {
          cid_principal: string | null
          created_at: string
          data_fim: string
          data_inicio: string
          descricao_cid: string | null
          dias_afastados: number | null
          dt_fim_atestado: string | null
          dt_inicio_atestado: string | null
          dt_nascimento: string | null
          empresa_id: string
          funcionario_id: string
          grupo_patologico: string | null
          hora_fim_atestado: string | null
          hora_inicio_atestado: string | null
          horas_afastado: string | null
          id: string
          matricula_func: string | null
          motivo: string | null
          observacao: string | null
          setor: string | null
          sexo: number | null
          tipo: string
          tipo_atestado: number | null
          tipo_licenca: string | null
          unidade: string | null
          updated_at: string
        }
        Insert: {
          cid_principal?: string | null
          created_at?: string
          data_fim: string
          data_inicio: string
          descricao_cid?: string | null
          dias_afastados?: number | null
          dt_fim_atestado?: string | null
          dt_inicio_atestado?: string | null
          dt_nascimento?: string | null
          empresa_id: string
          funcionario_id: string
          grupo_patologico?: string | null
          hora_fim_atestado?: string | null
          hora_inicio_atestado?: string | null
          horas_afastado?: string | null
          id?: string
          matricula_func?: string | null
          motivo?: string | null
          observacao?: string | null
          setor?: string | null
          sexo?: number | null
          tipo: string
          tipo_atestado?: number | null
          tipo_licenca?: string | null
          unidade?: string | null
          updated_at?: string
        }
        Update: {
          cid_principal?: string | null
          created_at?: string
          data_fim?: string
          data_inicio?: string
          descricao_cid?: string | null
          dias_afastados?: number | null
          dt_fim_atestado?: string | null
          dt_inicio_atestado?: string | null
          dt_nascimento?: string | null
          empresa_id?: string
          funcionario_id?: string
          grupo_patologico?: string | null
          hora_fim_atestado?: string | null
          hora_inicio_atestado?: string | null
          horas_afastado?: string | null
          id?: string
          matricula_func?: string | null
          motivo?: string | null
          observacao?: string | null
          setor?: string | null
          sexo?: number | null
          tipo?: string
          tipo_atestado?: number | null
          tipo_licenca?: string | null
          unidade?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "absenteismo_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absenteismo_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      acesso_empresas: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          permissao_escrita: boolean
          permissao_exclusao: boolean
          permissao_leitura: boolean
          updated_at: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          permissao_escrita?: boolean
          permissao_exclusao?: boolean
          permissao_leitura?: boolean
          updated_at?: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          permissao_escrita?: boolean
          permissao_exclusao?: boolean
          permissao_leitura?: boolean
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acesso_empresas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acesso_empresas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      acesso_telas: {
        Row: {
          created_at: string
          id: string
          permissao_escrita: boolean
          permissao_exclusao: boolean
          permissao_leitura: boolean
          tela_id: string
          updated_at: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permissao_escrita?: boolean
          permissao_exclusao?: boolean
          permissao_leitura?: boolean
          tela_id: string
          updated_at?: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permissao_escrita?: boolean
          permissao_exclusao?: boolean
          permissao_leitura?: boolean
          tela_id?: string
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acesso_telas_tela_id_fkey"
            columns: ["tela_id"]
            isOneToOne: false
            referencedRelation: "telas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acesso_telas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      convocacoes: {
        Row: {
          bairro: string | null
          cargo: string | null
          cep: string | null
          cidade: string | null
          cnpj_unidade: string | null
          codigo_empresa: number | null
          codigo_exame: string | null
          codigo_funcionario: number | null
          cpf_funcionario: string | null
          created_at: string
          data_admissao: string | null
          data_agendamento: string | null
          data_convocacao: string
          data_resultado: string | null
          email_funcionario: string | null
          empresa_id: string
          endereco: string | null
          estado: string | null
          exame: string | null
          funcionario_id: string
          hora_agendamento: string | null
          id: string
          matricula: string | null
          nome: string | null
          nome_abreviado: string | null
          observacoes: string | null
          periodicidade: number | null
          refazer: string | null
          setor: string | null
          status: string | null
          telefone_funcionario: string | null
          ultimo_pedido: string | null
          unidade: string | null
          updated_at: string
        }
        Insert: {
          bairro?: string | null
          cargo?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj_unidade?: string | null
          codigo_empresa?: number | null
          codigo_exame?: string | null
          codigo_funcionario?: number | null
          cpf_funcionario?: string | null
          created_at?: string
          data_admissao?: string | null
          data_agendamento?: string | null
          data_convocacao?: string
          data_resultado?: string | null
          email_funcionario?: string | null
          empresa_id: string
          endereco?: string | null
          estado?: string | null
          exame?: string | null
          funcionario_id: string
          hora_agendamento?: string | null
          id?: string
          matricula?: string | null
          nome?: string | null
          nome_abreviado?: string | null
          observacoes?: string | null
          periodicidade?: number | null
          refazer?: string | null
          setor?: string | null
          status?: string | null
          telefone_funcionario?: string | null
          ultimo_pedido?: string | null
          unidade?: string | null
          updated_at?: string
        }
        Update: {
          bairro?: string | null
          cargo?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj_unidade?: string | null
          codigo_empresa?: number | null
          codigo_exame?: string | null
          codigo_funcionario?: number | null
          cpf_funcionario?: string | null
          created_at?: string
          data_admissao?: string | null
          data_agendamento?: string | null
          data_convocacao?: string
          data_resultado?: string | null
          email_funcionario?: string | null
          empresa_id?: string
          endereco?: string | null
          estado?: string | null
          exame?: string | null
          funcionario_id?: string
          hora_agendamento?: string | null
          id?: string
          matricula?: string | null
          nome?: string | null
          nome_abreviado?: string | null
          observacoes?: string | null
          periodicidade?: number | null
          refazer?: string | null
          setor?: string | null
          status?: string | null
          telefone_funcionario?: string | null
          ultimo_pedido?: string | null
          unidade?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "convocacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "convocacoes_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          cnpj: string
          codigo: number | null
          complemento_endereco: string | null
          created_at: string
          endereco: string | null
          id: string
          inscricao_estadual: string | null
          inscricao_municipal: string | null
          nome: string
          nome_abreviado: string | null
          numero_endereco: string | null
          razao_social: string | null
          razao_social_inicial: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj: string
          codigo?: number | null
          complemento_endereco?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          nome: string
          nome_abreviado?: string | null
          numero_endereco?: string | null
          razao_social?: string | null
          razao_social_inicial?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string
          codigo?: number | null
          complemento_endereco?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          nome?: string
          nome_abreviado?: string | null
          numero_endereco?: string | null
          razao_social?: string | null
          razao_social_inicial?: string | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      funcionarios: {
        Row: {
          cargo: string
          cbo_cargo: string | null
          ccusto: string | null
          codigo: number | null
          codigo_cargo: string | null
          codigo_empresa: number | null
          codigo_setor: string | null
          codigo_unidade: string | null
          cor: number | null
          cpf: string | null
          created_at: string
          ctps: string | null
          data_admissao: string
          data_demissao: string | null
          data_nascimento: string | null
          data_ultima_alteracao: string | null
          deficiencia: string | null
          deficiente: boolean | null
          departamento: string | null
          email: string | null
          empresa_id: string
          escolaridade: number | null
          estado_civil: number | null
          id: string
          matricula_funcionario: string | null
          matricula_rh: string | null
          naturalidade: string | null
          nm_mae_funcionario: string | null
          nome: string
          nome_cargo: string | null
          nome_centro_custo: string | null
          nome_empresa: string | null
          nome_setor: string | null
          nome_unidade: string | null
          numero_endereco: string | null
          orgao_emissor_rg: string | null
          pis: string | null
          ramal: string | null
          regime_revezamento: number | null
          regime_trabalho: string | null
          rg: string | null
          rh_cargo: string | null
          rh_centro_custo_unidade: string | null
          rh_setor: string | null
          rh_unidade: string | null
          serie_ctps: string | null
          sexo: number | null
          situacao: string | null
          status: string | null
          tel_comercial: string | null
          telefone: string | null
          telefone_celular: string | null
          telefone_residencial: string | null
          tipo_contratacao: number | null
          turno_trabalho: number | null
          uf: string | null
          uf_rg: string | null
          updated_at: string
        }
        Insert: {
          cargo: string
          cbo_cargo?: string | null
          ccusto?: string | null
          codigo?: number | null
          codigo_cargo?: string | null
          codigo_empresa?: number | null
          codigo_setor?: string | null
          codigo_unidade?: string | null
          cor?: number | null
          cpf?: string | null
          created_at?: string
          ctps?: string | null
          data_admissao: string
          data_demissao?: string | null
          data_nascimento?: string | null
          data_ultima_alteracao?: string | null
          deficiencia?: string | null
          deficiente?: boolean | null
          departamento?: string | null
          email?: string | null
          empresa_id: string
          escolaridade?: number | null
          estado_civil?: number | null
          id?: string
          matricula_funcionario?: string | null
          matricula_rh?: string | null
          naturalidade?: string | null
          nm_mae_funcionario?: string | null
          nome: string
          nome_cargo?: string | null
          nome_centro_custo?: string | null
          nome_empresa?: string | null
          nome_setor?: string | null
          nome_unidade?: string | null
          numero_endereco?: string | null
          orgao_emissor_rg?: string | null
          pis?: string | null
          ramal?: string | null
          regime_revezamento?: number | null
          regime_trabalho?: string | null
          rg?: string | null
          rh_cargo?: string | null
          rh_centro_custo_unidade?: string | null
          rh_setor?: string | null
          rh_unidade?: string | null
          serie_ctps?: string | null
          sexo?: number | null
          situacao?: string | null
          status?: string | null
          tel_comercial?: string | null
          telefone?: string | null
          telefone_celular?: string | null
          telefone_residencial?: string | null
          tipo_contratacao?: number | null
          turno_trabalho?: number | null
          uf?: string | null
          uf_rg?: string | null
          updated_at?: string
        }
        Update: {
          cargo?: string
          cbo_cargo?: string | null
          ccusto?: string | null
          codigo?: number | null
          codigo_cargo?: string | null
          codigo_empresa?: number | null
          codigo_setor?: string | null
          codigo_unidade?: string | null
          cor?: number | null
          cpf?: string | null
          created_at?: string
          ctps?: string | null
          data_admissao?: string
          data_demissao?: string | null
          data_nascimento?: string | null
          data_ultima_alteracao?: string | null
          deficiencia?: string | null
          deficiente?: boolean | null
          departamento?: string | null
          email?: string | null
          empresa_id?: string
          escolaridade?: number | null
          estado_civil?: number | null
          id?: string
          matricula_funcionario?: string | null
          matricula_rh?: string | null
          naturalidade?: string | null
          nm_mae_funcionario?: string | null
          nome?: string
          nome_cargo?: string | null
          nome_centro_custo?: string | null
          nome_empresa?: string | null
          nome_setor?: string | null
          nome_unidade?: string | null
          numero_endereco?: string | null
          orgao_emissor_rg?: string | null
          pis?: string | null
          ramal?: string | null
          regime_revezamento?: number | null
          regime_trabalho?: string | null
          rg?: string | null
          rh_cargo?: string | null
          rh_centro_custo_unidade?: string | null
          rh_setor?: string | null
          rh_unidade?: string | null
          serie_ctps?: string | null
          sexo?: number | null
          situacao?: string | null
          status?: string | null
          tel_comercial?: string | null
          telefone?: string | null
          telefone_celular?: string | null
          telefone_residencial?: string | null
          tipo_contratacao?: number | null
          turno_trabalho?: number | null
          uf?: string | null
          uf_rg?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          created_at: string
          id: string
          nome: string
          tipo_usuario: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          nome: string
          tipo_usuario: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          tipo_usuario?: string
          updated_at?: string
        }
        Relationships: []
      }
      telas: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      usuario_empresas: {
        Row: {
          empresa_id: string
          id: string
          usuario_id: string
        }
        Insert: {
          empresa_id: string
          id?: string
          usuario_id: string
        }
        Update: {
          empresa_id?: string
          id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuario_empresas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      user_can_access_empresa: {
        Args: {
          empresa_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
