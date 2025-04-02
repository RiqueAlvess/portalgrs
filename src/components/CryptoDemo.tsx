
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle, Info, Key, Upload, Download, File } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cryptoClient } from "@/utils/cryptoClient";

export function CryptoDemo() {
  // Estado para a seção de texto
  const [originalText, setOriginalText] = useState("");
  const [encryptedText, setEncryptedText] = useState("");
  const [decryptedText, setDecryptedText] = useState("");
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);

  // Estado para a seção de arquivos
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [encryptedFile, setEncryptedFile] = useState<Blob | null>(null);
  const [encryptedFileName, setEncryptedFileName] = useState("");
  const [isEncryptingFile, setIsEncryptingFile] = useState(false);
  const [isDecryptingFile, setIsDecryptingFile] = useState(false);

  // Estado geral
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [serviceStatus, setServiceStatus] = useState<'checking' | 'available' | 'unavailable' | 'error'>('checking');

  // Verificar status do serviço de criptografia ao carregar o componente
  useEffect(() => {
    checkServiceStatus();
  }, []);

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

  // Funções para manipulação de texto
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
      toast({
        title: "Texto criptografado",
        description: "O texto foi criptografado com sucesso.",
        variant: "default"
      });
    } catch (err: any) {
      console.error("Erro ao criptografar:", err);
      setError(err.message || "Erro ao criptografar o texto");
      toast({
        title: "Erro ao criptografar",
        description: err.message || "Erro ao criptografar o texto",
        variant: "destructive"
      });
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
      toast({
        title: "Texto descriptografado",
        description: "O texto foi descriptografado com sucesso.",
        variant: "default"
      });
    } catch (err: any) {
      console.error("Erro ao descriptografar:", err);
      setError(err.message || "Erro ao descriptografar o texto");
      toast({
        title: "Erro ao descriptografar",
        description: err.message || "Erro ao descriptografar o texto",
        variant: "destructive"
      });
    } finally {
      setIsDecrypting(false);
    }
  };

  // Funções para manipulação de arquivos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Verificar se o arquivo é XLSX
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.encrypted')) {
        setError("Por favor, selecione um arquivo XLSX ou um arquivo criptografado (.encrypted)");
        setSelectedFile(null);
        return;
      }
      
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleEncryptFile = async () => {
    if (!selectedFile) {
      setError("Selecione um arquivo para criptografar");
      return;
    }

    if (!selectedFile.name.endsWith('.xlsx')) {
      setError("Por favor, selecione um arquivo XLSX para criptografar");
      return;
    }

    setError(null);
    setSuccess(null);
    setIsEncryptingFile(true);

    try {
      const encryptedBlob = await cryptoClient.encryptFile(selectedFile);
      setEncryptedFile(encryptedBlob);
      setEncryptedFileName(`${selectedFile.name}.encrypted`);
      setSuccess("Arquivo criptografado com sucesso!");
      toast({
        title: "Arquivo criptografado",
        description: "O arquivo foi criptografado com sucesso.",
        variant: "default"
      });
    } catch (err: any) {
      console.error("Erro ao criptografar arquivo:", err);
      setError(err.message || "Erro ao criptografar o arquivo");
      toast({
        title: "Erro ao criptografar arquivo",
        description: err.message || "Erro ao criptografar o arquivo",
        variant: "destructive"
      });
    } finally {
      setIsEncryptingFile(false);
    }
  };

  const handleDecryptFile = async () => {
    if (!selectedFile) {
      setError("Selecione um arquivo para descriptografar");
      return;
    }

    if (!selectedFile.name.endsWith('.encrypted')) {
      setError("Por favor, selecione um arquivo criptografado (.encrypted)");
      return;
    }

    setError(null);
    setSuccess(null);
    setIsDecryptingFile(true);

    try {
      const { blob, filename, type } = await cryptoClient.decryptFile(selectedFile);
      
      // Criar URL para download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSuccess("Arquivo descriptografado com sucesso e download iniciado!");
      toast({
        title: "Arquivo descriptografado",
        description: "O arquivo foi descriptografado com sucesso e o download foi iniciado.",
        variant: "default"
      });
    } catch (err: any) {
      console.error("Erro ao descriptografar arquivo:", err);
      setError(err.message || "Erro ao descriptografar o arquivo");
      toast({
        title: "Erro ao descriptografar arquivo",
        description: err.message || "Erro ao descriptografar o arquivo",
        variant: "destructive"
      });
    } finally {
      setIsDecryptingFile(false);
    }
  };

  const handleDownloadEncryptedFile = () => {
    if (!encryptedFile) return;
    
    const url = URL.createObjectURL(encryptedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = encryptedFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Status do serviço
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
          Criptografia de Dados
        </CardTitle>
        <CardDescription>
          Ferramenta para criptografar e descriptografar textos e arquivos XLSX utilizando algoritmo AES-256-GCM.
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

        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text">Texto</TabsTrigger>
            <TabsTrigger value="file">Arquivos XLSX</TabsTrigger>
          </TabsList>
          
          <TabsContent value="text" className="space-y-4 pt-4">
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
          </TabsContent>
          
          <TabsContent value="file" className="space-y-4 pt-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Input
                id="fileUpload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".xlsx,.encrypted"
              />
              <Label htmlFor="fileUpload" className="cursor-pointer flex flex-col items-center">
                <Upload className="h-12 w-12 text-gray-400 mb-2" />
                <span className="text-lg font-medium mb-1">Selecione um arquivo</span>
                <span className="text-sm text-muted-foreground">
                  Arquivos XLSX para criptografar ou .encrypted para descriptografar
                </span>
              </Label>
            </div>
            
            {selectedFile && (
              <Alert className="bg-muted border-muted-foreground">
                <File className="h-4 w-4 mr-2" />
                <AlertTitle>Arquivo selecionado</AlertTitle>
                <AlertDescription>
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex space-x-2">
              <Button 
                onClick={handleEncryptFile} 
                className="flex-1"
                disabled={!selectedFile || isEncryptingFile || serviceStatus !== 'available' || (selectedFile && !selectedFile.name.endsWith('.xlsx'))}
              >
                {isEncryptingFile ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criptografando...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Criptografar Arquivo
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleDecryptFile} 
                className="flex-1"
                disabled={!selectedFile || isDecryptingFile || serviceStatus !== 'available' || (selectedFile && !selectedFile.name.endsWith('.encrypted'))}
              >
                {isDecryptingFile ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Descriptografando...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Descriptografar Arquivo
                  </>
                )}
              </Button>
            </div>
            
            {encryptedFile && (
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">Arquivo criptografado pronto</h4>
                    <p className="text-sm text-muted-foreground">{encryptedFileName}</p>
                  </div>
                  <Button variant="outline" onClick={handleDownloadEncryptedFile}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
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
