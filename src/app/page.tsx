'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Recycle, MapPin, Info, Zap, ZapOff } from 'lucide-react';
import Image from 'next/image';
import DisposalLocations from '@/components/DisposalLocations';
import * as tmImage from '@teachablemachine/image';

interface AnalysisResult {
  isRecyclable: boolean;
  material: string;
  category: string;
  disposalInfo: string;
  confidence: number;
}

// URL do modelo Teachable Machine
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/7s87fVPZw/";

// Mapeamento das classes do modelo para informações de reciclagem
const recyclingDatabase: Record<string, AnalysisResult> = {
  'Garrafa pet': {
    isRecyclable: true,
    material: 'Garrafa PET',
    category: 'Reciclável',
    disposalInfo: 'Lave e seque antes de descartar. Remova o rótulo se possível. Pode ser reciclado em pontos de coleta seletiva.',
    confidence: 0
  },
  'Pneu/borracha': {
    isRecyclable: true,
    material: 'Pneu/Borracha',
    category: 'Reciclável',
    disposalInfo: 'Pneus devem ser descartados em pontos específicos de coleta. Não descarte no lixo comum. Procure borracharias ou pontos de coleta de pneus.',
    confidence: 0
  },
  'Objetos de vidro (pratos)': {
    isRecyclable: true,
    material: 'Vidro',
    category: 'Reciclável',
    disposalInfo: 'Lave e remova tampas. Vidro é 100% reciclável e pode ser reutilizado infinitamente. Cuidado com cacos.',
    confidence: 0
  },
  'Caixa de papelão': {
    isRecyclable: true,
    material: 'Papelão',
    category: 'Reciclável',
    disposalInfo: 'Desmonte caixas de papelão e mantenha seco. Pode ser reciclado mesmo com fitas adesivas.',
    confidence: 0
  },
  'Esponja de lavar louça': {
    isRecyclable: false,
    material: 'Esponja de Lavar Louça',
    category: 'Não Reciclável',
    disposalInfo: 'Esponjas não são recicláveis. Descarte no lixo comum. Considere usar esponjas reutilizáveis ou biodegradáveis.',
    confidence: 0
  },
  'Pilhas/baterias': {
    isRecyclable: false,
    material: 'Pilhas/Baterias',
    category: 'Resíduo Perigoso',
    disposalInfo: 'Nunca descarte no lixo comum. Procure pontos de coleta de pilhas e baterias. Estes materiais contêm substâncias tóxicas.',
    confidence: 0
  },
  'Palha de aço': {
    isRecyclable: false,
    material: 'Palha de Aço',
    category: 'Não Reciclável',
    disposalInfo: 'Palha de aço não é reciclável. Descarte no lixo comum. Considere alternativas reutilizáveis.',
    confidence: 0
  },
  'Default (vazio)': {
    isRecyclable: false,
    material: 'Material não identificado',
    category: 'Não Identificado',
    disposalInfo: 'Não foi possível identificar o material com confiança suficiente. O objeto pode não estar no banco de dados do modelo. Tente capturar uma imagem mais clara, com melhor iluminação, ou consulte informações locais sobre reciclagem.',
    confidence: 0
  }
};

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showDisposalLocations, setShowDisposalLocations] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [model, setModel] = useState<tmImage.CustomMobileNet | null>(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  // Carregar modelo e obter geolocalização ao montar o componente
  useEffect(() => {
    loadModel();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalização não suportada pelo navegador');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        console.log('Localização obtida:', position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error('Erro ao obter localização:', error);
        setLocationError('Não foi possível obter sua localização. Permita o acesso à localização.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const loadModel = async () => {
    try {
      setModelLoading(true);
      const modelURL = MODEL_URL + "model.json";
      const metadataURL = MODEL_URL + "metadata.json";
      const loadedModel = await tmImage.load(modelURL, metadataURL);
      setModel(loadedModel);
      console.log('Modelo carregado com sucesso');
    } catch (error) {
      console.error('Erro ao carregar modelo:', error);
      alert('Erro ao carregar o modelo de IA. Verifique sua conexão.');
    } finally {
      setModelLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      console.log('Iniciando câmera...');
      setCameraLoading(true);
      setShowCamera(true); // Mostra a interface da câmera primeiro
      
      // Primeiro tenta com câmera traseira (mobile)
      let constraints = { 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      };
      
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (error) {
        console.log('Câmera traseira não disponível, tentando câmera frontal...');
        // Se falhar, tenta câmera frontal (desktop)
        constraints = { 
          video: { 
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      }
      
      console.log('Stream obtido:', stream);
      streamRef.current = stream; // Salvar o stream para controlar o flash
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Aguardar o video carregar
        videoRef.current.onloadedmetadata = () => {
          console.log('Metadata carregada, iniciando reprodução...');
          setCameraLoading(false);
          videoRef.current?.play().catch(e => console.error('Erro ao reproduzir:', e));
        };
        
        // Fallback caso onloadedmetadata não funcione
        setTimeout(() => {
          if (videoRef.current) {
            setCameraLoading(false);
            videoRef.current.play().catch(e => console.error('Erro no fallback:', e));
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      setShowCamera(false);
      setCameraLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'Verifique as permissões.';
      alert(`Erro ao acessar câmera: ${errorMessage}`);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setCameraLoading(false);
    setFlashOn(false);
  };

  const toggleFlash = async () => {
    if (!streamRef.current) return;

    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;

    const capabilities = videoTrack.getCapabilities() as MediaTrackCapabilities & { torch?: boolean };
    if (!capabilities.torch) {
      alert('Flash não disponível neste dispositivo');
      return;
    }

    try {
      await videoTrack.applyConstraints({
        advanced: [{ torch: !flashOn } as MediaTrackConstraints]
      });
      setFlashOn(!flashOn);
    } catch (error) {
      console.error('Erro ao controlar flash:', error);
      alert('Não foi possível controlar o flash');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        // Define o tamanho do canvas igual ao vídeo
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Desenha o vídeo no canvas (invertido horizontalmente)
        context.scale(-1, 1);
        context.drawImage(video, -canvas.width, 0);
        
        // Converte para imagem
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        stopCamera();
        analyzeImage(imageData);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setCapturedImage(imageData);
        analyzeImage(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (imageData: string) => {
    if (!model) {
      alert('Modelo ainda não carregado. Aguarde um momento e tente novamente.');
      return;
    }

    setIsAnalyzing(true);

    try {
      // Criar uma imagem a partir do base64
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageData;
      });

      // Criar um canvas temporário para a predição
      const tempCanvas = document.createElement('canvas');
      const tempContext = tempCanvas.getContext('2d');
      if (!tempContext) {
        throw new Error('Não foi possível criar contexto do canvas');
      }

      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      tempContext.drawImage(img, 0, 0);

      // Fazer a predição
      const prediction = await model.predict(tempCanvas);
      
      if (!prediction || prediction.length === 0) {
        throw new Error('Nenhuma predição retornada');
      }

      // Encontrar a classe com maior probabilidade
      let bestPrediction = prediction[0];
      for (let i = 1; i < prediction.length; i++) {
        if (prediction[i].probability > bestPrediction.probability) {
          bestPrediction = prediction[i];
        }
      }

      const className = bestPrediction.className;
      const confidence = Math.round(bestPrediction.probability * 100);

      console.log('Classe detectada:', className, 'Confiança:', confidence + '%');
      console.log('Todas as predições:', prediction.map(p => `${p.className}: ${(p.probability * 100).toFixed(1)}%`));

      // Threshold de confiança mínimo (70% para ser considerado válido)
      const MIN_CONFIDENCE_THRESHOLD = 70;
      
      // Se a confiança for muito baixa, usar Default
      let finalClassName = className;
      if (confidence < MIN_CONFIDENCE_THRESHOLD || className === 'Default (vazio)') {
        finalClassName = 'Default (vazio)';
        console.warn(`Confiança muito baixa (${confidence}%). Usando classificação padrão.`);
      }

      // Buscar informações na base de dados
      const materialInfo = recyclingDatabase[finalClassName] || recyclingDatabase['Default (vazio)'];
      
      const analysisResult: AnalysisResult = {
        ...materialInfo,
        confidence: confidence
      };

      setResult(analysisResult);
    } catch (error) {
      console.error('Erro na análise:', error);
      alert('Erro ao analisar a imagem. Tente novamente.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setResult(null);
    setCapturedImage(null);
  };


  return (
    <div className="min-h-screen bg-black font-poppins relative overflow-hidden">
      {/* Advanced Background Effects */}
      <div className="absolute inset-0">
        {/* Subtle Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/10 via-black to-gray-800/5"></div>
        
        {/* Floating Orbs */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-gray-800/20 to-gray-700/20 rounded-full blur-2xl"></div>
        <div className="absolute top-40 right-20 w-48 h-48 bg-gradient-to-r from-gray-700/15 to-gray-800/15 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-gradient-to-r from-gray-800/20 to-gray-600/20 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-gradient-to-r from-gray-700/10 to-gray-800/10 rounded-full blur-xl"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>
      
      {/* Modern Header */}
      <header className="relative z-10 glass border-b border-white/10 shadow-modern">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
              <div className="relative group">
                <div className="relative p-4 bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl shadow-glow transition-transform duration-300 group-hover:scale-105">
                  <Recycle className="h-10 w-10 text-white" />
                </div>
            </div>
            <div>
                <h1 className="text-3xl font-black text-white">
                ReciclaApp
              </h1>
                <p className="text-white text-sm font-medium">Inteligência Artificial para Reciclagem Sustentável</p>
              </div>
            </div>
            
            {/* Status Indicator */}
            <div className="hidden md:flex items-center space-x-2 glass-card px-4 py-2 rounded-full">
              {modelLoading ? (
                <>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-white font-medium">Carregando IA...</span>
                </>
              ) : model ? (
                <>
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-sm text-white font-medium">Sistema Online</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className="text-sm text-white font-medium">IA Indisponível</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-6 py-8">

        {/* Modern Capture Area */}
        {!capturedImage ? (
          <div className="relative group">
            {/* Advanced Glow Effect */}
            <div className="absolute -inset-2 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 rounded-3xl blur-lg opacity-20 group-hover:opacity-40 transition-all duration-300"></div>
            
            <div className="relative glass-card rounded-3xl p-8 shadow-modern">
              <div className="text-center mb-8">
                <div className="relative inline-block mb-6 group/icon">
                  <div className="relative bg-gradient-to-r from-gray-800 to-gray-700 rounded-3xl p-8 shadow-glow transition-all duration-300 group-hover/icon:scale-105">
                    <Camera className="h-16 w-16 text-white" />
                  </div>
                </div>
                
                <h2 className="text-4xl font-black text-white mb-4">
                  Análise Inteligente
                </h2>
                <p className="text-white text-lg font-medium mb-2">Powered by AI Vision Technology</p>
                <p className="text-white text-sm">Capture ou envie uma foto para análise instantânea com IA</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={startCamera}
                  className="px-10 py-5 bg-gradient-to-r from-gray-800 to-gray-700 text-white rounded-xl flex items-center justify-center space-x-4 hover:opacity-80 transition-all duration-200 shadow-md hover:shadow-lg font-medium cursor-pointer text-lg"
                >
                  <Camera className="h-6 w-6" />
                  <span>Abrir Câmera</span>
                </button>
                
                  <button
                    onClick={() => fileInputRef.current?.click()}
                  className="px-10 py-5 glass-card text-white rounded-xl flex items-center justify-center space-x-4 hover:opacity-80 transition-all duration-200 shadow-md hover:shadow-lg border border-white/20 font-medium cursor-pointer text-lg"
                >
                  <Upload className="h-6 w-6" />
                  <span>Enviar Foto</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-3xl shadow-modern overflow-hidden mb-6">
            <div className="p-6">
              <div className="flex justify-center">
                <Image
                  src={capturedImage}
                  alt="Material capturado"
                  width={600}
                  height={400}
                  className="max-w-lg h-80 object-contain rounded-2xl shadow-modern"
                />
              </div>
            </div>
            
            {isAnalyzing ? (
              <div className="p-8 text-center">
                <div className="relative inline-block mb-6">
                  <div className="spinner mx-auto mb-4"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-lg opacity-30 animate-pulse"></div>
                </div>
                <p className="text-white text-lg font-medium">Analisando material com IA...</p>
                <div className="mt-4 w-full bg-white/10 rounded-full h-2">
                  <div className="bg-gradient-to-r from-gray-700 to-gray-600 h-2 rounded-full"></div>
                </div>
              </div>
            ) : result ? (
              <div className="p-6">
                <div className={`glass-card p-6 rounded-2xl mb-6 border ${
                  result.isRecyclable 
                    ? 'border-gray-400/30 shadow-glow-accent' 
                    : 'border-gray-500/30 shadow-glow-secondary'
                }`}>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`w-4 h-4 rounded-full ${
                      result.isRecyclable ? 'bg-white' : 'bg-gray-400'
                    }`}></div>
                    <h3 className="text-xl font-bold text-white">{result.category}</h3>
                    <div className={`ml-auto glass-card px-3 py-1 rounded-full ${
                      result.confidence < 70 ? 'bg-red-500/20 border border-red-500/30' : ''
                    }`}>
                      <span className={`text-sm font-medium ${
                        result.confidence < 70 ? 'text-red-300' : 'text-white'
                      }`}>
                        {result.confidence}% confiança
                        {result.confidence < 70 && ' ⚠️'}
                      </span>
                    </div>
                  </div>
                  <p className="text-white text-lg font-semibold">{result.material}</p>
                  {result.confidence < 70 && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                      <p className="text-red-300 text-sm">
                        ⚠️ Confiança baixa. O resultado pode não ser preciso. Tente capturar uma imagem mais clara.
                      </p>
                    </div>
                  )}
                </div>
                
                
                <div className="space-y-3">
                {userLocation && (
                  <button
                    onClick={() => setShowDisposalLocations(true)}
                    className="px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-700 text-white rounded-xl flex items-center justify-center space-x-2 hover:opacity-80 transition-all duration-200 shadow-md hover:shadow-lg font-medium cursor-pointer"
                  >
                    <MapPin className="h-5 w-5" />
                    <span>Encontrar Pontos de Descarte</span>
                  </button>
                )}
                
                <button
                  onClick={resetAnalysis}
                    className="px-6 py-3 glass-card text-white rounded-xl hover:opacity-80 transition-all duration-200 shadow-md hover:shadow-lg border border-white/20 font-medium cursor-pointer"
                >
                    <span>Analisar Outro Material</span>
                </button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Modern Camera Interface */}
        {showCamera && (
          <div className="fixed inset-0 bg-black z-50 flex flex-col">
            <div className="flex-1 relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }} // Espelha a imagem
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Modern Loading Overlay */}
              {cameraLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                  <div className="text-center">
                    <div className="relative mb-6">
                      <div className="spinner mx-auto mb-4"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-lg opacity-30 animate-pulse"></div>
                    </div>
                    <p className="text-white text-lg font-medium">Inicializando câmera...</p>
                    <div className="mt-4 w-64 bg-white/10 rounded-full h-2 mx-auto">
                      <div className="bg-gradient-to-r from-gray-500 to-slate-500 h-2 rounded-full"></div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Camera Instructions Overlay */}
              <div className="absolute top-6 left-6 right-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="glass-card p-4 rounded-2xl shadow-modern flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl">
                        <Camera className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Posicione o material</h3>
                        <p className="text-white text-sm">Centralize o objeto que deseja analisar</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Flash Button */}
                  <button
                    onClick={toggleFlash}
                    className={`p-4 rounded-2xl shadow-modern transition-all duration-200 ${
                      flashOn 
                        ? 'bg-white text-black' 
                        : 'glass-card text-white border border-white/20'
                    }`}
                    title={flashOn ? 'Desligar flash' : 'Ligar flash'}
                  >
                    {flashOn ? (
                      <Zap className="h-6 w-6" />
                    ) : (
                      <ZapOff className="h-6 w-6" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Camera Controls */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
              <div className="flex space-x-6">
                <button
                  onClick={stopCamera}
                  className="px-8 py-4 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-colors flex items-center space-x-3 font-medium text-lg"
                >
                  <span className="text-xl">✕</span>
                  <span>Cancelar</span>
                </button>
                <button
                  onClick={capturePhoto}
                  className="px-10 py-5 bg-white text-black rounded-xl hover:bg-gray-200 transition-colors flex items-center space-x-4 font-bold text-xl shadow-lg"
                >
                  <Camera className="h-8 w-8" />
                  <span>Capturar</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Modais */}
      <DisposalLocations
        material={result?.material || ''}
        isOpen={showDisposalLocations}
        onClose={() => setShowDisposalLocations(false)}
        userLocation={userLocation}
      />
    </div>
  );
}