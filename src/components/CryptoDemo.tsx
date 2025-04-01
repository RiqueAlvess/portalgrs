
import React, { useState, useEffect } from 'react';
import { cryptoClient } from '@/utils/cryptoClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { AlertCircle, ShieldCheck, Lock, Unlock, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const CryptoDemo = () => {
  const [inputText, setInputText] = useState('');
  const [encryptedText, setEncryptedText] = useState('');
  const [decryptedText, setDecryptedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Verificar o status do serviço ao carregar o componente
  useEffect(() => {
    checkServiceStatus();
  }, []);

  const checkServiceStatus = async () => {
    try {
      setServiceStatus('checking');
      // Tentar criptografar um texto simples para verificar se o serviço está disponível
      await cryptoClient.encrypt('test');
      setServiceStatus('available');
      setErrorMessage(null);
    } catch (error: any) {
      console.error('Erro ao verificar status do serviço:', error);
      setServiceStatus('unavailable');
      
      // Extrair mensagem de erro mais específica
      if (error.message.includes('ENCRYPTION_KEY')) {
        setErrorMessage('A chave de criptografia (ENCRYPTION_KEY) não está configurada no Supabase.');
      } else {
        setErrorMessage(error.message || 'Não foi possível conectar ao serviço de criptografia.');
      }
    }
  };

  const handleEncrypt = async () => {
    if (!inputText) {
      toast.error('Por favor, insira um texto para criptografar');
      return;
    }

    setIsLoading(true);
    try {
      const encrypted = await cryptoClient.encrypt(inputText);
      setEncryptedText(encrypted);
      toast.success('Texto criptografado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao criptografar:', error);
      toast.error(`Erro ao criptografar: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecrypt = async () => {
    if (!encryptedText) {
      toast.error('Não há texto criptografado para descriptografar');
      return;
    }

    setIsLoading(true);
    try {
      const decrypted = await cryptoClient.decrypt(encryptedText);
      setDecryptedText(decrypted);
      toast.success('Texto descriptografado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao descriptografar:', error);
      toast.error(`Erro ao descriptografar: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (serviceStatus === 'checking') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[200px]">
          <RefreshCw className="h-10 w-10 animate-spin text-muted-foreground mb-4" />
          <p>Verificando disponibilidade do serviço de criptografia...</p>
        </CardContent>
      </Card>
    );
  }

  if (serviceStatus === 'unavailable') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Serviço de Criptografia Indisponível
          </CardTitle>
          <CardDescription>
            Não foi possível conectar ao serviço de criptografia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro no serviço</AlertTitle>
            <AlertDescription>
              {errorMessage || 'O serviço de criptografia não está disponível no momento.'}
            </AlertDescription>
          </Alert>
          
          <div className="mt-6 space-y-4">
            <p className="text-sm">Para resolver este problema:</p>
            <ol className="list-decimal pl-5 text-sm space-y-2">
              <li>Verifique se a variável de ambiente <strong>ENCRYPTION_KEY</strong> está configurada nas Edge Functions do Supabase.</li>
              <li>Confirme se a função <strong>cryptoService</strong> está corretamente implantada.</li>
              <li>Verifique os logs da Edge Function para identificar possíveis erros.</li>
            </ol>

            <Button 
              onClick={checkServiceStatus} 
              variant="outline" 
              className="mt-4"
              disabled={isLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Verificar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Demonstração de Criptografia
        </CardTitle>
        <CardDescription>
          Este componente demonstra o uso do serviço de criptografia para proteger dados sensíveis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Texto Original</label>
          <div className="flex space-x-2">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Digite o texto a ser criptografado"
            />
            <Button onClick={handleEncrypt} disabled={isLoading || !inputText}>
              {isLoading ? 'Processando...' : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Criptografar
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Texto Criptografado</label>
          <Input
            value={encryptedText}
            readOnly
            placeholder="O texto criptografado aparecerá aqui"
            className="font-mono text-xs"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Texto Descriptografado</label>
            <Button 
              onClick={handleDecrypt} 
              disabled={isLoading || !encryptedText}
              variant="outline"
              size="sm"
            >
              <Unlock className="mr-2 h-4 w-4" />
              Descriptografar
            </Button>
          </div>
          <Input
            value={decryptedText}
            readOnly
            placeholder="O texto descriptografado aparecerá aqui"
          />
        </div>
      </CardContent>
      <CardFooter className="border-t pt-6">
        <p className="text-sm text-muted-foreground">
          Os dados são criptografados usando AES-256-GCM, um padrão de criptografia seguro. 
          A chave de criptografia é armazenada nas variáveis de ambiente do servidor, não no banco de dados.
        </p>
      </CardFooter>
    </Card>
  );
};
