
import { supabase } from "@/integrations/supabase/client";

/**
 * Cliente para o serviço de criptografia
 */
export const cryptoClient = {
  /**
   * Criptografa uma string
   * @param data String a ser criptografada
   * @returns String criptografada
   */
  async encrypt(data: string): Promise<string> {
    try {
      const { data: result, error } = await supabase.functions.invoke('cryptoService', {
        body: { action: 'encrypt', data }
      });

      if (error) {
        console.error('Erro na chamada da Edge Function:', error);
        if (error.message.includes('524')) {
          throw new Error('Timeout na conexão com o serviço de criptografia. Verifique se a Edge Function está ativa.');
        }
        throw new Error(`Erro na Edge Function: ${error.message}`);
      }

      if (!result?.success) {
        console.error('Erro retornado pelo serviço de criptografia:', result?.error);
        throw new Error(result?.error || 'Falha ao criptografar dados');
      }

      return result.result;
    } catch (error: any) {
      console.error('Erro ao chamar o serviço de criptografia:', error);
      
      // Melhorar as mensagens de erro para facilitar o diagnóstico
      if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        throw new Error('Não foi possível conectar ao serviço de criptografia. Verifique sua conexão e se a Edge Function está implantada.');
      }
      
      throw error;
    }
  },

  /**
   * Descriptografa uma string
   * @param encryptedData String criptografada
   * @returns String descriptografada
   */
  async decrypt(encryptedData: string): Promise<string> {
    try {
      const { data: result, error } = await supabase.functions.invoke('cryptoService', {
        body: { action: 'decrypt', data: encryptedData }
      });

      if (error) {
        console.error('Erro na chamada da Edge Function:', error);
        if (error.message.includes('524')) {
          throw new Error('Timeout na conexão com o serviço de criptografia. Verifique se a Edge Function está ativa.');
        }
        throw new Error(`Erro na Edge Function: ${error.message}`);
      }

      if (!result?.success) {
        console.error('Erro retornado pelo serviço de criptografia:', result?.error);
        throw new Error(result?.error || 'Falha ao descriptografar dados');
      }

      return result.result;
    } catch (error: any) {
      console.error('Erro ao chamar o serviço de criptografia:', error);
      
      // Melhorar as mensagens de erro para facilitar o diagnóstico
      if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        throw new Error('Não foi possível conectar ao serviço de criptografia. Verifique sua conexão e se a Edge Function está implantada.');
      }
      
      throw error;
    }
  },
};
