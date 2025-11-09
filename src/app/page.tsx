'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, Recycle, MapPin, Zap, ZapOff } from 'lucide-react';
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
// Baseado nas labels do modelo: ["Esponja","Pilha/bateria","Papelão","Garrafa pet","Defaut","Vidro ","Palha de aço","Pneu/borracha"]
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
  'Vidro ': {
    isRecyclable: true,
    material: 'Vidro',
    category: 'Reciclável',
    disposalInfo: 'Lave e remova tampas. Vidro é 100% reciclável e pode ser reutilizado infinitamente. Cuidado com cacos.',
    confidence: 0
  },
  'Papelão': {
    isRecyclable: true,
    material: 'Papelão',
    category: 'Reciclável',
    disposalInfo: 'Desmonte caixas de papelão e mantenha seco. Pode ser reciclado mesmo com fitas adesivas.',
    confidence: 0
  },
  'Esponja': {
    isRecyclable: false,
    material: 'Esponja',
    category: 'Não Reciclável',
    disposalInfo: 'Esponjas não são recicláveis. Descarte no lixo comum. Considere usar esponjas reutilizáveis ou biodegradáveis.',
    confidence: 0
  },
  'Pilha/bateria': {
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
  'Defaut': {
    isRecyclable: false,
    material: 'Material não identificado',
    category: 'Não Identificado',
    disposalInfo: 'Não foi possível identificar o material com confiança suficiente. O objeto pode não estar no banco de dados do modelo. Tente capturar uma imagem mais clara, com melhor iluminação, ou consulte informações locais sobre reciclagem.',
    confidence: 0
  }
};

export default function Home() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showDisposalLocations, setShowDisposalLocations] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [model, setModel] = useState<tmImage.CustomMobileNet | null>(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const webcamRef = useRef<tmImage.Webcam | null>(null);
  const webcamContainerRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  // Carregar modelo e obter geolocalização ao montar o componente
  useEffect(() => {
    loadModel();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      console.warn('Geolocalização não suportada pelo navegador');
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
    if (!model) {
      alert('Modelo ainda não carregado. Aguarde um momento e tente novamente.');
      return;
    }

    try {
      console.log('Iniciando câmera...');
      setCameraLoading(true);
      setShowCamera(true);
      
      // Usar tmImage.Webcam como no código HTML
      const flip = true;
      const webcam = new tmImage.Webcam(320, 240, flip);
      await webcam.setup(); // pede permissão
      await webcam.play();
      
      webcamRef.current = webcam;
      
      // Adicionar o canvas do webcam ao container
      if (webcamContainerRef.current) {
        webcamContainerRef.current.innerHTML = '';
        webcam.canvas.style.width = '100%';
        webcam.canvas.style.height = '100%';
        webcam.canvas.style.objectFit = 'cover';
        webcamContainerRef.current.appendChild(webcam.canvas);
      }
      
      setCameraLoading(false);
      
      // Iniciar o loop de predição
      runLoop();
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      setShowCamera(false);
      setCameraLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'Verifique as permissões.';
      alert(`Erro ao acessar câmera: ${errorMessage}`);
    }
  };

  const stopCamera = () => {
    // Cancelar o loop de predição
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    
    if (webcamRef.current) {
      try {
        webcamRef.current.stop();
      } catch (e) {
        console.error('Erro ao parar webcam:', e);
      }
      webcamRef.current = null;
    }
    
    if (webcamContainerRef.current) {
      webcamContainerRef.current.innerHTML = '';
    }
    
    setShowCamera(false);
    setCameraLoading(false);
    setFlashOn(false);
    setResult(null);
  };

  const toggleFlash = async () => {
    // O tmImage.Webcam não expõe diretamente o stream, então precisamos acessar via canvas
    // Por enquanto, vamos desabilitar o flash já que não temos acesso direto ao stream
    alert('Controle de flash não disponível com esta implementação');
  };

  // Loop de predição em tempo real - seguindo exatamente a lógica do HTML
  const runLoop = async () => {
    if (!webcamRef.current) {
      return;
    }

    webcamRef.current.update();
    await predict();
    rafIdRef.current = requestAnimationFrame(runLoop);
  };

  // Função de predição em tempo real - seguindo exatamente a lógica do HTML
  const predict = async () => {
    if (!model || !webcamRef.current) {
      console.warn('Modelo ou webcam não disponível para predição');
      return;
    }

    try {
      // Predição real do modelo Teachable Machine
      const prediction = await model.predict(webcamRef.current.canvas);
      
      if (!prediction || prediction.length === 0) {
        console.warn('Nenhuma predição retornada');
        return;
      }

      // Encontrar a classe com maior probabilidade
      let best = prediction[0];
      for (let i = 1; i < prediction.length; i++) {
        if (prediction[i].probability > best.probability) {
          best = prediction[i];
        }
      }

      const className = best.className;
      const confidence = Math.round(best.probability * 100);

      // Logs para debug - você pode ver no console do navegador
      console.log('=== PREDIÇÃO REAL DO MODELO ===');
      console.log('Classe detectada:', className);
      console.log('Confiança:', confidence + '%');
      console.log('Todas as predições:', prediction.map(p => `${p.className}: ${(p.probability * 100).toFixed(1)}%`));
      console.log('==============================');

      // Threshold de confiança mínimo reduzido para 50%
      const MIN_CONFIDENCE_THRESHOLD = 50;
      
      // Se a confiança for muito baixa OU for Defaut, usar Defaut
      let finalClassName = className;
      if (confidence < MIN_CONFIDENCE_THRESHOLD || className === 'Defaut') {
        finalClassName = 'Defaut';
        console.warn(`Confiança baixa (${confidence}%) ou classe Defaut. Usando Defaut.`);
      }

      // Buscar informações na base de dados
      const materialInfo = recyclingDatabase[finalClassName] || recyclingDatabase['Defaut'];
      
      const analysisResult: AnalysisResult = {
        ...materialInfo,
        confidence: confidence
      };

      setResult(analysisResult);
    } catch (err) {
      console.error('Erro na predição:', err);
    }
  };

  const resetAnalysis = () => {
    setResult(null);
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
        {!showCamera && (
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
                  Análise Inteligente em Tempo Real
                </h2>
                <p className="text-white text-lg font-medium mb-2">Powered by AI Vision Technology</p>
                <p className="text-white text-sm">A IA reconhece materiais em tempo real através da câmera</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={startCamera}
                  className="px-10 py-5 bg-gradient-to-r from-gray-800 to-gray-700 text-white rounded-xl flex items-center justify-center space-x-4 hover:opacity-80 transition-all duration-200 shadow-md hover:shadow-lg font-medium cursor-pointer text-lg"
                >
                  <Camera className="h-6 w-6" />
                  <span>Abrir Câmera</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Resultado da análise em tempo real */}
        {result && !showCamera && (
          <div className="mt-6 glass-card rounded-3xl shadow-modern overflow-hidden">
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
                <p className="text-white text-sm mt-2">{result.disposalInfo}</p>
                {result.confidence < 70 && (
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <p className="text-red-300 text-sm">
                      ⚠️ Confiança baixa. O resultado pode não ser preciso. Tente posicionar o objeto melhor na câmera.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                {userLocation && (
                  <button
                    onClick={() => setShowDisposalLocations(true)}
                    className="px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-700 text-white rounded-xl flex items-center justify-center space-x-2 hover:opacity-80 transition-all duration-200 shadow-md hover:shadow-lg font-medium cursor-pointer w-full"
                  >
                    <MapPin className="h-5 w-5" />
                    <span>Encontrar Pontos de Descarte</span>
                  </button>
                )}
                
                <button
                  onClick={resetAnalysis}
                  className="px-6 py-3 glass-card text-white rounded-xl hover:opacity-80 transition-all duration-200 shadow-md hover:shadow-lg border border-white/20 font-medium cursor-pointer w-full"
                >
                  <span>Limpar Resultado</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modern Camera Interface */}
        {showCamera && (
          <div className="fixed inset-0 bg-black z-50 flex flex-col">
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
              <div 
                ref={webcamContainerRef}
                className="w-full h-full flex items-center justify-center"
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              />
              
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
              <div className="absolute top-3 md:top-6 left-3 md:left-6 right-3 md:right-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
                  <div className="glass-card p-3 md:p-4 rounded-2xl shadow-modern max-w-md w-full md:w-auto">
                    <div className="flex items-center space-x-2 md:space-x-4">
                      <div className="p-2 md:p-3 bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl flex-shrink-0">
                        <Camera className="h-5 w-5 md:h-6 md:w-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base md:text-lg font-bold text-white">Reconhecimento em Tempo Real</h3>
                        <p className="text-white text-xs md:text-sm">Posicione o material na frente da câmera</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Flash Button and Close Button */}
                  <div className="flex items-center gap-2 md:gap-3 self-end md:self-auto">
                    <button
                      onClick={toggleFlash}
                      className={`p-3 md:p-4 rounded-2xl shadow-modern transition-all duration-200 cursor-pointer flex-shrink-0 ${
                        flashOn 
                          ? 'bg-white text-black' 
                          : 'glass-card text-white border border-white/20'
                      }`}
                      title={flashOn ? 'Desligar flash' : 'Ligar flash'}
                    >
                      {flashOn ? (
                        <Zap className="h-5 w-5 md:h-6 md:w-6" />
                      ) : (
                        <ZapOff className="h-5 w-5 md:h-6 md:w-6" />
                      )}
                    </button>
                    
                    <button
                      onClick={stopCamera}
                      className="p-3 md:p-4 rounded-2xl shadow-modern transition-all duration-200 cursor-pointer glass-card text-white border border-white/20 hover:bg-white/10 flex-shrink-0"
                      title="Fechar câmera"
                    >
                      <span className="text-xl md:text-2xl font-bold">×</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Resultado em tempo real na câmera */}
              {result && (
                <div className="absolute bottom-20 md:bottom-36 left-3 md:left-1/2 right-3 md:right-auto md:transform md:-translate-x-1/2 z-30 w-full max-w-md md:w-auto md:mx-auto">
                  <div className={`glass-card p-3 md:p-4 rounded-2xl shadow-modern border ${
                    result.isRecyclable 
                      ? 'border-gray-400/30' 
                      : 'border-gray-500/30'
                  }`}>
                    <div className="flex items-center space-x-2 md:space-x-3 mb-2">
                      <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full flex-shrink-0 ${
                        result.isRecyclable ? 'bg-white' : 'bg-gray-400'
                      }`}></div>
                      <h3 className="text-sm md:text-lg font-bold text-white truncate flex-1 min-w-0">{result.category}</h3>
                      <div className={`ml-auto glass-card px-2 py-1 rounded-full flex-shrink-0 ${
                        result.confidence < 50 ? 'bg-red-500/20 border border-red-500/30' : ''
                      }`}>
                        <span className={`text-xs font-medium ${
                          result.confidence < 50 ? 'text-red-300' : 'text-white'
                        }`}>
                          {result.confidence}%
                        </span>
                      </div>
                    </div>
                    <p className="text-white text-xs md:text-base font-semibold break-words">{result.material}</p>
                  </div>
                </div>
              )}
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