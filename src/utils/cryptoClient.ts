
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

      if (error || !result?.success) {
        console.error('Erro ao criptografar dados:', error || result?.error);
        throw new Error(result?.error || 'Falha ao criptografar dados');
      }

      return result.result;
    } catch (error) {
      console.error('Erro ao chamar o serviço de criptografia:', error);
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

      if (error || !result?.success) {
        console.error('Erro ao descriptografar dados:', error || result?.error);
        throw new Error(result?.error || 'Falha ao descriptografar dados');
      }

      return result.result;
    } catch (error) {
      console.error('Erro ao chamar o serviço de criptografia:', error);
      throw error;
    }
  },
};
