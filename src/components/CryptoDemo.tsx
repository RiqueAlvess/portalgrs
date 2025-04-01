
import React, { useState } from 'react';
import { cryptoClient } from '@/utils/cryptoClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export const CryptoDemo = () => {
  const [inputText, setInputText] = useState('');
  const [encryptedText, setEncryptedText] = useState('');
  const [decryptedText, setDecryptedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    } catch (error) {
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
    } catch (error) {
      console.error('Erro ao descriptografar:', error);
      toast.error(`Erro ao descriptografar: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Demonstração de Criptografia</CardTitle>
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
              {isLoading ? 'Processando...' : 'Criptografar'}
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
