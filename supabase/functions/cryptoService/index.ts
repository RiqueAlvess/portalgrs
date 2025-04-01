
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { encode as encodeBase64, decode as decodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

// Configuração de CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Converte uma string em um array de bytes
 */
function strToUint8Array(str: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

/**
 * Converte um array de bytes em uma string
 */
function uint8ArrayToStr(uint8Array: Uint8Array): string {
  const decoder = new TextDecoder();
  return decoder.decode(uint8Array);
}

/**
 * Gera uma chave AES-256 a partir de uma senha
 */
async function generateKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    strToUint8Array(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Criptografa dados
 */
async function encrypt(data: string, secretKey: string): Promise<string> {
  try {
    // Gera um IV aleatório
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Gera um salt aleatório
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    // Gera a chave de criptografia
    const key = await generateKey(secretKey, salt);
    
    // Criptografa os dados
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      strToUint8Array(data)
    );
    
    // Converte o resultado para uma representação mais fácil de armazenar
    const encryptedArray = new Uint8Array(encryptedData);
    
    // Combina salt, iv e dados criptografados em um único array
    const resultArray = new Uint8Array(salt.length + iv.length + encryptedArray.length);
    resultArray.set(salt, 0);
    resultArray.set(iv, salt.length);
    resultArray.set(encryptedArray, salt.length + iv.length);
    
    // Codifica em base64 para armazenamento ou transmissão
    return encodeBase64(resultArray);
  } catch (error) {
    console.error("Erro durante a criptografia:", error);
    throw new Error("Falha ao criptografar dados");
  }
}

/**
 * Descriptografa dados
 */
async function decrypt(encryptedData: string, secretKey: string): Promise<string> {
  try {
    // Decodifica os dados criptografados
    const encryptedArray = decodeBase64(encryptedData);
    
    // Extrai salt, iv e dados criptografados
    const salt = encryptedArray.slice(0, 16);
    const iv = encryptedArray.slice(16, 28);
    const data = encryptedArray.slice(28);
    
    // Gera a chave de criptografia
    const key = await generateKey(secretKey, salt);
    
    // Descriptografa os dados
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      data
    );
    
    // Converte o resultado para string
    return uint8ArrayToStr(new Uint8Array(decryptedData));
  } catch (error) {
    console.error("Erro durante a descriptografia:", error);
    throw new Error("Falha ao descriptografar dados");
  }
}

serve(async (req) => {
  console.log("Solicitação recebida para o serviço de criptografia");
  
  // Tratamento de requisições CORS OPTIONS
  if (req.method === "OPTIONS") {
    console.log("Respondendo a solicitação CORS OPTIONS");
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Verificar a existência da chave de criptografia
    const encryptionKey = Deno.env.get("ENCRYPTION_KEY");
    if (!encryptionKey) {
      console.error("ENCRYPTION_KEY não configurada");
      throw new Error("ENCRYPTION_KEY não configurada");
    }
    
    // Se for apenas um pedido de verificação de status
    const url = new URL(req.url);
    if (url.pathname.endsWith("/status")) {
      console.log("Verificação de status solicitada");
      return new Response(
        JSON.stringify({ 
          success: true, 
          status: "available",
          message: "Serviço de criptografia está operacional" 
        }),
        {
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json" 
          },
          status: 200,
        }
      );
    }

    // Verificação de body
    try {
      // Processamento da requisição
      const { action, data } = await req.json();
      
      if (!action || data === undefined) {
        throw new Error("Parâmetros incompletos: 'action' e 'data' são obrigatórios");
      }

      console.log(`Executando ação: ${action}`);
      
      let result;
      // Execução da ação solicitada
      switch (action) {
        case "encrypt":
          console.log("Criptografando dados...");
          result = await encrypt(data, encryptionKey);
          break;
        
        case "decrypt":
          console.log("Descriptografando dados...");
          result = await decrypt(data, encryptionKey);
          break;
        
        default:
          throw new Error(`Ação desconhecida: ${action}`);
      }

      // Retorno do resultado
      return new Response(
        JSON.stringify({
          success: true,
          result,
        }),
        {
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json" 
          },
          status: 200,
        }
      );
    } catch (parseError) {
      console.error("Erro ao processar o body da requisição:", parseError);
      throw new Error(`Erro ao processar a requisição: ${parseError.message}`);
    }
  } catch (error) {
    console.error("Erro no serviço de criptografia:", error);
    
    // Determinar o código de status baseado no tipo de erro
    let statusCode = 500;
    if (error.message.includes('não configurad')) {
      statusCode = 400;
    } else if (error.message.includes('Parâmetros incompletos')) {
      statusCode = 400;
    } else if (error.message.includes('não autenticado') || error.message.includes('Autorização necessária')) {
      statusCode = 401;
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Erro interno do servidor",
      }),
      {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        },
        status: statusCode,
      }
    );
  }
});
