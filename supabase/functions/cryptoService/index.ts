
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode, decode } from "https://deno.land/std@0.187.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função para derivar chaves de criptografia a partir da chave mestra
async function deriveKey(masterKey: string, salt: Uint8Array, info: Uint8Array): Promise<CryptoKey> {
  // Converter a chave mestra para um ArrayBuffer
  const encoder = new TextEncoder();
  const masterKeyBuffer = encoder.encode(masterKey);
  
  // Importar a chave mestra
  const importedMasterKey = await crypto.subtle.importKey(
    "raw",
    masterKeyBuffer,
    { name: "HKDF" },
    false,
    ["deriveBits", "deriveKey"]
  );
  
  // Derivar uma chave AES-GCM a partir da chave mestra
  return await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: salt,
      info: info
    },
    importedMasterKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// Encriptar dados
async function encryptData(plaintext: string): Promise<string> {
  try {
    // Verificar se a chave de criptografia está configurada
    const encryptionKey = Deno.env.get("ENCRYPTION_KEY");
    if (!encryptionKey) {
      throw new Error("Chave de criptografia (ENCRYPTION_KEY) não configurada");
    }

    // Gerar salt e nonce aleatórios
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    
    // Informações de contexto para derivação da chave
    const info = new TextEncoder().encode("GRS-PORTAL-CRYPTO-2024");
    
    // Derivar a chave de criptografia
    const key = await deriveKey(encryptionKey, salt, info);
    
    // Encriptar os dados
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: nonce
      },
      key,
      data
    );
    
    // Construir o resultado final (salt + nonce + ciphertext)
    const result = new Uint8Array(salt.length + nonce.length + ciphertext.byteLength);
    result.set(salt, 0);
    result.set(nonce, salt.length);
    result.set(new Uint8Array(ciphertext), salt.length + nonce.length);
    
    // Retornar os dados encriptados em formato Base64
    return encode(result);
  } catch (error) {
    console.error("Erro na encriptação:", error);
    throw error;
  }
}

// Decriptar dados
async function decryptData(encryptedData: string): Promise<string> {
  try {
    // Verificar se a chave de criptografia está configurada
    const encryptionKey = Deno.env.get("ENCRYPTION_KEY");
    if (!encryptionKey) {
      throw new Error("Chave de criptografia (ENCRYPTION_KEY) não configurada");
    }

    // Decodificar o dado encriptado de Base64 para Uint8Array
    const data = decode(encryptedData);
    
    // Extrair salt, nonce e ciphertext do dado encriptado
    const salt = data.slice(0, 16);
    const nonce = data.slice(16, 28);
    const ciphertext = data.slice(28);
    
    // Informações de contexto para derivação da chave
    const info = new TextEncoder().encode("GRS-PORTAL-CRYPTO-2024");
    
    // Derivar a chave de criptografia
    const key = await deriveKey(encryptionKey, salt, info);
    
    // Decriptar os dados
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: nonce
      },
      key,
      ciphertext
    );
    
    // Converter o resultado para string
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error("Erro na decriptação:", error);
    
    // Melhorar a mensagem de erro
    if (error.name === "OperationError") {
      throw new Error("Falha na descriptografia: dados inválidos ou chave incorreta");
    }
    
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Verificar status do serviço
    if (req.url.includes('/status')) {
      const hasEncryptionKey = !!Deno.env.get("ENCRYPTION_KEY");
      
      return new Response(
        JSON.stringify({
          available: true,
          hasEncryptionKey: hasEncryptionKey,
          message: hasEncryptionKey ? "Serviço de criptografia configurado e funcionando" : "Serviço disponível, mas sem chave de criptografia configurada"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Processar requisição normal
    const requestData = await req.json();
    const { action, data } = requestData;

    if (!action) {
      throw new Error("Ação não especificada");
    }

    let result;
    
    switch (action) {
      case "status":
        const hasEncryptionKey = !!Deno.env.get("ENCRYPTION_KEY");
        
        result = {
          success: true,
          available: true,
          hasEncryptionKey: hasEncryptionKey,
          message: hasEncryptionKey ? "Serviço de criptografia configurado e funcionando" : "Serviço disponível, mas sem chave de criptografia configurada"
        };
        break;
        
      case "encrypt":
        if (!data) {
          throw new Error("Dados para criptografar não fornecidos");
        }
        
        const encryptedData = await encryptData(data);
        result = {
          success: true,
          result: encryptedData
        };
        break;
        
      case "decrypt":
        if (!data) {
          throw new Error("Dados para descriptografar não fornecidos");
        }
        
        const decryptedData = await decryptData(data);
        result = {
          success: true,
          result: decryptedData
        };
        break;
        
      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erro no serviço de criptografia:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Erro interno no serviço de criptografia",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
