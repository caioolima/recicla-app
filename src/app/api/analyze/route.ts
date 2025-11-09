import { NextRequest, NextResponse } from 'next/server';

// Interface para o resultado da análise
interface AnalysisResult {
  isRecyclable: boolean;
  material: string;
  category: string;
  disposalInfo: string;
  confidence: number;
  recyclingCode?: string;
}

// Base de dados especializada em reciclagem
const recyclingDatabase = {
  // Plásticos
  'plastic bottle': { isRecyclable: true, material: 'Garrafa PET', category: 'Reciclável', disposalInfo: 'Lave e seque antes de descartar. Remova o rótulo se possível. Pode ser reciclado em pontos de coleta seletiva.', recyclingCode: 'PET' },
  'plastic container': { isRecyclable: true, material: 'Embalagem Plástica', category: 'Reciclável', disposalInfo: 'Lave e seque antes de descartar. Verifique o código de reciclagem (1-7) na embalagem.', recyclingCode: 'VAR' },
  'plastic bag': { isRecyclable: false, material: 'Saco Plástico', category: 'Não Reciclável', disposalInfo: 'Sacos plásticos finos não são reciclados na coleta seletiva comum. Procure pontos específicos para sacolas plásticas.', recyclingCode: null },
  
  // Papel e Papelão
  'cardboard': { isRecyclable: true, material: 'Papelão', category: 'Reciclável', disposalInfo: 'Desmonte caixas de papelão e mantenha seco. Pode ser reciclado mesmo com fitas adesivas.', recyclingCode: null },
  'paper': { isRecyclable: true, material: 'Papel', category: 'Reciclável', disposalInfo: 'Separe de outros materiais. Papel limpo e seco pode ser reciclado. Evite papel engordurado ou com cola.', recyclingCode: null },
  'newspaper': { isRecyclable: true, material: 'Jornal', category: 'Reciclável', disposalInfo: 'Mantenha seco e limpo. Jornais são facilmente recicláveis.', recyclingCode: null },
  
  // Vidro
  'glass bottle': { isRecyclable: true, material: 'Garrafa de Vidro', category: 'Reciclável', disposalInfo: 'Lave e remova tampas. Vidro é 100% reciclável e pode ser reutilizado infinitamente.', recyclingCode: null },
  'glass jar': { isRecyclable: true, material: 'Pote de Vidro', category: 'Reciclável', disposalInfo: 'Lave e remova tampas. Vidro é 100% reciclável.', recyclingCode: null },
  
  // Metais
  'aluminum can': { isRecyclable: true, material: 'Lata de Alumínio', category: 'Reciclável', disposalInfo: 'Lave e amasse para economizar espaço. Alumínio é 100% reciclável.', recyclingCode: null },
  'tin can': { isRecyclable: true, material: 'Lata de Estanho', category: 'Reciclável', disposalInfo: 'Lave bem antes de descartar. Pode conter resíduos de alimentos.', recyclingCode: null },
  
  // Orgânicos
  'food waste': { isRecyclable: false, material: 'Resíduo Orgânico', category: 'Compostável', disposalInfo: 'Pode ser compostado ou descartado no lixo orgânico. Evite desperdício alimentar.', recyclingCode: null },
  'banana peel': { isRecyclable: false, material: 'Casca de Banana', category: 'Compostável', disposalInfo: 'Excelente para compostagem. Rico em nutrientes para o solo.', recyclingCode: null },
  
  // Eletrônicos
  'electronic device': { isRecyclable: false, material: 'Dispositivo Eletrônico', category: 'Resíduo Eletrônico', disposalInfo: 'Não descarte no lixo comum. Procure pontos de coleta de lixo eletrônico ou devolva ao fabricante.', recyclingCode: null },
  'battery': { isRecyclable: false, material: 'Bateria', category: 'Resíduo Perigoso', disposalInfo: 'Nunca descarte no lixo comum. Procure pontos de coleta de pilhas e baterias.', recyclingCode: null },
  
  // Têxteis
  'clothing': { isRecyclable: false, material: 'Roupa', category: 'Reutilização', disposalInfo: 'Considere doar para instituições de caridade ou pontos de coleta de roupas usadas.', recyclingCode: null },
  'fabric': { isRecyclable: false, material: 'Tecido', category: 'Reutilização', disposalInfo: 'Pode ser reutilizado ou doado. Alguns tecidos são recicláveis em pontos específicos.', recyclingCode: null }
};

export async function POST(request: NextRequest) {
  try {
    const { imageData } = await request.json();
    
    if (!imageData) {
      return NextResponse.json({ error: 'Imagem não fornecida' }, { status: 400 });
    }

    // Aqui você integraria com o Google Vision API
    // Por enquanto, vamos simular a análise com base em uma lista de objetos detectados
    const detectedObjects = await simulateVisionAPI(imageData);
    
    // Encontrar o melhor match na base de dados
    const result = findBestMatch(detectedObjects);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro na análise:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

async function simulateVisionAPI(imageData: string): Promise<string[]> {
  // Simulação da resposta do Google Vision API
  // Em produção, aqui você faria a chamada real para a API
  
  const possibleObjects = Object.keys(recyclingDatabase);
  const numObjects = Math.floor(Math.random() * 3) + 1; // 1-3 objetos
  const detectedObjects: string[] = [];
  
  for (let i = 0; i < numObjects; i++) {
    const randomObject = possibleObjects[Math.floor(Math.random() * possibleObjects.length)];
    if (!detectedObjects.includes(randomObject)) {
      detectedObjects.push(randomObject);
    }
  }
  
  return detectedObjects;
}

function findBestMatch(detectedObjects: string[]): AnalysisResult {
  // Encontrar o melhor match na base de dados
  for (const object of detectedObjects) {
    if (recyclingDatabase[object as keyof typeof recyclingDatabase]) {
      const data = recyclingDatabase[object as keyof typeof recyclingDatabase];
      return {
        isRecyclable: data.isRecyclable,
        material: data.material,
        category: data.category,
        disposalInfo: data.disposalInfo,
        confidence: Math.floor(Math.random() * 20) + 80, // 80-100% de confiança
        recyclingCode: data.recyclingCode || undefined
      };
    }
  }
  
  // Se não encontrar match específico, retornar resultado genérico
  return {
    isRecyclable: false,
    material: 'Material não identificado',
    category: 'Não Identificado',
    disposalInfo: 'Não foi possível identificar o material. Tente capturar uma imagem mais clara ou consulte informações locais sobre reciclagem.',
    confidence: 50
  };
}

// Função para integração real com Google Vision API (comentada)
/*
async function callGoogleVisionAPI(imageData: string): Promise<any> {
  const vision = require('@google-cloud/vision');
  const client = new vision.ImageAnnotatorClient({
    keyFilename: 'path/to/service-account-key.json', // Configure suas credenciais
  });

  const image = {
    content: imageData.replace(/^data:image\/[a-z]+;base64,/, ''), // Remove data URL prefix
  };

  const [result] = await client.objectLocalization(image);
  return result.localizedObjectAnnotations;
}
*/

