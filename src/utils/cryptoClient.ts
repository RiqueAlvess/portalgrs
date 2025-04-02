
import { supabase } from "@/integrations/supabase/client";

/**
 * Cliente para o serviço de criptografia
 */
export const cryptoClient = {
  /**
   * Verifica o status do serviço de criptografia
   * @returns Status do serviço
   */
  async status(): Promise<{ data?: { available: boolean, message?: string }, error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('cryptoService', {
        body: { action: 'status' }
      });

      if (error) {
        console.error('Erro na chamada da Edge Function:', error);
        return {
          error: error.message || 'Erro ao verificar status do serviço de criptografia'
        };
      }

      return { 
        data: {
          available: data?.available || false,
          message: data?.message
        }
      };
    } catch (error: any) {
      console.error('Erro ao verificar status do serviço de criptografia:', error);
      return {
        error: error.message || 'Erro ao verificar status do serviço de criptografia'
      };
    }
  },

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

  /**
   * Criptografa um arquivo
   * @param file Arquivo a ser criptografado
   * @returns Arquivo criptografado como Blob
   */
  async encryptFile(file: File): Promise<Blob> {
    try {
      // Converter o arquivo para base64
      const fileBase64 = await this.fileToBase64(file);
      
      // Enviar para o serviço de criptografia
      const { data: result, error } = await supabase.functions.invoke('cryptoService', {
        body: { 
          action: 'encryptFile',
          data: {
            content: fileBase64,
            filename: file.name,
            type: file.type
          }
        }
      });

      if (error) {
        console.error('Erro na chamada da Edge Function:', error);
        throw new Error(`Erro na Edge Function: ${error.message}`);
      }

      if (!result?.success) {
        console.error('Erro retornado pelo serviço de criptografia:', result?.error);
        throw new Error(result?.error || 'Falha ao criptografar arquivo');
      }

      // Converter o resultado de volta para Blob
      const encryptedBlob = this.base64ToBlob(result.result.content, 'application/octet-stream');
      return encryptedBlob;
    } catch (error: any) {
      console.error('Erro ao criptografar arquivo:', error);
      throw error;
    }
  },

  /**
   * Descriptografa um arquivo
   * @param file Arquivo criptografado
   * @returns Arquivo descriptografado como Blob com tipo original
   */
  async decryptFile(file: File): Promise<{ blob: Blob, filename: string, type: string }> {
    try {
      // Converter o arquivo para base64
      const fileBase64 = await this.fileToBase64(file);
      
      // Enviar para o serviço de criptografia
      const { data: result, error } = await supabase.functions.invoke('cryptoService', {
        body: { 
          action: 'decryptFile',
          data: fileBase64
        }
      });

      if (error) {
        console.error('Erro na chamada da Edge Function:', error);
        throw new Error(`Erro na Edge Function: ${error.message}`);
      }

      if (!result?.success) {
        console.error('Erro retornado pelo serviço de criptografia:', result?.error);
        throw new Error(result?.error || 'Falha ao descriptografar arquivo');
      }

      // Converter o resultado de volta para Blob
      const decryptedBlob = this.base64ToBlob(result.result.content, result.result.type);
      return {
        blob: decryptedBlob,
        filename: result.result.filename,
        type: result.result.type
      };
    } catch (error: any) {
      console.error('Erro ao descriptografar arquivo:', error);
      throw error;
    }
  },

  // Helpers para converter entre File/Blob e base64
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remover o prefixo "data:*/*;base64," do resultado
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
    });
  },

  base64ToBlob(base64: string, type: string): Blob {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
      const slice = byteCharacters.slice(offset, offset + 1024);
      const byteNumbers = new Array(slice.length);
      
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type });
  }
};
