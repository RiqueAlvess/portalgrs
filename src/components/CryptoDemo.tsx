
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle, Info, Key } from "lucide-react";
import { cryptoClient } from "@/utils/cryptoClient";

export function CryptoDemo() {
  const [originalText, setOriginalText] = useState("");
  const [encryptedText, setEncryptedText] = useState("");
  const [decryptedText, setDecryptedText] = useState("");
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [serviceStatus, setServiceStatus] = useState<'checking' | 'available' | 'unavailable' | 'error'>('checking');

  // Verificar status do serviço de criptografia ao carregar o componente
  useState(() => {
    checkServiceStatus();
  });

  const checkServiceStatus = async () => {
    setServiceStatus('checking');
    try {
      const { data, error } = await cryptoClient.status();
      
      if (error) {
        throw new Error(error);
      }
      
      if (data?.available) {
        setServiceStatus('available');
      } else {
        setServiceStatus('unavailable');
        setError("Serviço de criptografia disponível, mas sem chave de criptografia configurada");
      }
    } catch (err) {
      console.error("Erro ao verificar status do serviço:", err);
      setServiceStatus('error');
      setError("Serviço de criptografia indisponível. Verifique se a Edge Function está implantada.");
    }
  };

  const handleEncrypt = async () => {
    if (!originalText) {
      setError("Digite um texto para criptografar");
      return;
    }

    setError(null);
    setSuccess(null);
    setIsEncrypting(true);

    try {
      const encrypted = await cryptoClient.encrypt(originalText);
      setEncryptedText(encrypted);
      setSuccess("Texto criptografado com sucesso!");
    } catch (err: any) {
      console.error("Erro ao criptografar:", err);
      setError(err.message || "Erro ao criptografar o texto");
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleDecrypt = async () => {
    if (!encryptedText) {
      setError("Digite um texto criptografado para descriptografar");
      return;
    }

    setError(null);
    setSuccess(null);
    setIsDecrypting(true);

    try {
      const decrypted = await cryptoClient.decrypt(encryptedText);
      setDecryptedText(decrypted);
      setSuccess("Texto descriptografado com sucesso!");
    } catch (err: any) {
      console.error("Erro ao descriptografar:", err);
      setError(err.message || "Erro ao descriptografar o texto");
    } finally {
      setIsDecrypting(false);
    }
  };

  const getStatusContent = () => {
    switch (serviceStatus) {
      case 'checking':
        return (
          <Alert className="mb-4 bg-muted">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <AlertTitle>Verificando serviço de criptografia...</AlertTitle>
            <AlertDescription>
              Aguarde enquanto verificamos o status do serviço.
            </AlertDescription>
          </Alert>
        );
      case 'available':
        return (
          <Alert className="mb-4 bg-success/20 border-success text-success">
            <CheckCircle className="h-4 w-4 mr-2" />
            <AlertTitle>Serviço de criptografia disponível</AlertTitle>
            <AlertDescription>
              A criptografia está configurada e pronta para uso.
            </AlertDescription>
          </Alert>
        );
      case 'unavailable':
        return (
          <Alert className="mb-4 bg-warning/20 border-warning">
            <Info className="h-4 w-4 mr-2" />
            <AlertTitle>Configuração pendente</AlertTitle>
            <AlertDescription>
              O serviço de criptografia está acessível, mas a chave de criptografia não está configurada. 
              Configure a variável de ambiente ENCRYPTION_KEY nas Edge Functions do Supabase.
            </AlertDescription>
          </Alert>
        );
      case 'error':
        return (
          <Alert className="mb-4 bg-destructive/20 border-destructive">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertTitle>Serviço indisponível</AlertTitle>
            <AlertDescription>
              Não foi possível conectar ao serviço de criptografia. Verifique se a Edge Function cryptoService está implantada.
            </AlertDescription>
          </Alert>
        );
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Key className="h-5 w-5 mr-2" />
          Demonstração de Criptografia
        </CardTitle>
        <CardDescription>
          Este componente demonstra o uso da criptografia AES-256-GCM para proteger dados sensíveis.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {getStatusContent()}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-success/20 border-success">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Sucesso</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="originalText">Texto Original</Label>
            <div className="flex mt-1.5">
              <Input
                id="originalText"
                value={originalText}
                onChange={(e) => setOriginalText(e.target.value)}
                placeholder="Digite o texto para criptografar"
                className="flex-1"
              />
              <Button 
                onClick={handleEncrypt} 
                className="ml-2"
                disabled={isEncrypting || serviceStatus !== 'available'}
              >
                {isEncrypting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criptografando...
                  </>
                ) : (
                  "Criptografar"
                )}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="encryptedText">Texto Criptografado</Label>
            <Input
              id="encryptedText"
              value={encryptedText}
              onChange={(e) => setEncryptedText(e.target.value)}
              placeholder="Texto criptografado aparecerá aqui"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="decryptedText">Texto Descriptografado</Label>
            <div className="flex mt-1.5">
              <Input
                id="decryptedText"
                value={decryptedText}
                readOnly
                placeholder="Texto descriptografado aparecerá aqui"
                className="flex-1"
              />
              <Button 
                onClick={handleDecrypt} 
                className="ml-2"
                disabled={isDecrypting || serviceStatus !== 'available'}
              >
                {isDecrypting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Descriptografando...
                  </>
                ) : (
                  "Descriptografar"
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          <p>A criptografia é realizada usando o algoritmo AES-256-GCM via Supabase Edge Functions.</p>
          <p>A chave de criptografia nunca é armazenada no banco de dados ou exposta no frontend.</p>
        </div>
      </CardFooter>
    </Card>
  );
}
