import { NextRequest, NextResponse } from 'next/server';

interface PlaceResult {
  id: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  hours?: string;
  distance: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  rating?: number;
  types?: string[];
}

// Função para calcular distância em km entre duas coordenadas
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const material = searchParams.get('material') || 'reciclagem';

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Coordenadas de localização são obrigatórias' },
        { status: 400 }
      );
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    // Usar Google Places API se tiver chave, senão usar Overpass API (OpenStreetMap)
    const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
    
    let places: PlaceResult[] = [];

    if (GOOGLE_PLACES_API_KEY) {
      // Buscar usando Google Places API
      const searchQuery = `pontos de coleta ${material} reciclagem`;
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&location=${userLat},${userLng}&radius=10000&key=${GOOGLE_PLACES_API_KEY}`;
      
      try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          places = await Promise.all(
            data.results.slice(0, 10).map(async (place: any) => {
              const distance = calculateDistance(
                userLat,
                userLng,
                place.geometry.location.lat,
                place.geometry.location.lng
              );

              // Buscar detalhes do lugar para obter telefone e website
              let phone, website, hours;
              try {
                const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=formatted_phone_number,website,opening_hours&key=${GOOGLE_PLACES_API_KEY}`;
                const detailsResponse = await fetch(detailsUrl);
                const detailsData = await detailsResponse.json();
                if (detailsData.result) {
                  phone = detailsData.result.formatted_phone_number;
                  website = detailsData.result.website;
                  if (detailsData.result.opening_hours?.weekday_text) {
                    hours = detailsData.result.opening_hours.weekday_text.join(', ');
                  }
                }
              } catch (error) {
                console.error('Erro ao buscar detalhes:', error);
              }

              return {
                id: place.place_id,
                name: place.name,
                address: place.formatted_address || place.vicinity || 'Endereço não disponível',
                phone: phone || 'Não disponível',
                website: website,
                hours: hours || 'Horário não disponível',
                distance: distance,
                coordinates: {
                  lat: place.geometry.location.lat,
                  lng: place.geometry.location.lng
                },
                rating: place.rating,
                types: place.types
              };
            })
          );

          // Ordenar por distância
          places.sort((a, b) => a.distance - b.distance);
        }
      } catch (error) {
        console.error('Erro ao buscar no Google Places:', error);
      }
    }

    // Se não encontrou lugares ou não tem chave do Google, usar Overpass API (OpenStreetMap)
    if (places.length === 0) {
      try {
        // Buscar recicladoras, pontos de coleta, etc. usando Overpass API
        const overpassQuery = `
          [out:json][timeout:25];
          (
            node["amenity"="recycling"](around:10000,${userLat},${userLng});
            node["recycling:plastic"="yes"](around:10000,${userLat},${userLng});
            node["recycling:glass"="yes"](around:10000,${userLat},${userLng});
            node["recycling:paper"="yes"](around:10000,${userLat},${userLng});
            way["amenity"="recycling"](around:10000,${userLat},${userLng});
          );
          out center;
        `;

        const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
        const response = await fetch(overpassUrl);
        const data = await response.json();

        if (data.elements && data.elements.length > 0) {
          // Processar elementos e buscar nomes usando reverse geocoding quando necessário
          places = await Promise.all(
            data.elements.slice(0, 10).map(async (element: any) => {
              const elementLat = element.lat || (element.center?.lat);
              const elementLng = element.lon || (element.center?.lon);
              
              if (!elementLat || !elementLng) return null;

              const distance = calculateDistance(userLat, userLng, elementLat, elementLng);
              
              // Tentar obter nome do elemento
              let placeName = element.tags?.name;
              let placeAddress = element.tags?.['addr:street'] 
                ? `${element.tags['addr:street']}, ${element.tags['addr:housenumber'] || ''} - ${element.tags['addr:city'] || ''}`.trim()
                : null;

              // Se não tem nome, usar reverse geocoding para obter informações
              if (!placeName) {
                try {
                  const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${elementLat}&lon=${elementLng}&addressdetails=1`;
                  const reverseResponse = await fetch(nominatimUrl, {
                    headers: {
                      'User-Agent': 'ReciclaApp/1.0'
                    }
                  });
                  const reverseData = await reverseResponse.json();
                  
                  if (reverseData.address) {
                    const addr = reverseData.address;
                    // Tentar construir um nome descritivo
                    if (addr.road || addr.street) {
                      placeName = `Ponto de Reciclagem - ${addr.road || addr.street}`;
                    } else if (addr.neighbourhood || addr.suburb) {
                      placeName = `Ponto de Reciclagem - ${addr.neighbourhood || addr.suburb}`;
                    } else if (addr.quarter || addr.district) {
                      placeName = `Ponto de Reciclagem - ${addr.quarter || addr.district}`;
                    } else if (addr.city || addr.town || addr.municipality) {
                      placeName = `Ponto de Reciclagem - ${addr.city || addr.town || addr.municipality}`;
                    } else {
                      placeName = 'Ponto de Reciclagem';
                    }
                    
                    // Construir endereço completo se não tiver
                    if (!placeAddress && reverseData.display_name) {
                      placeAddress = reverseData.display_name;
                    }
                  }
                } catch (error) {
                  console.error('Erro no reverse geocoding:', error);
                }
              }
              
              // Fallback final se ainda não tiver nome
              if (!placeName) {
                placeName = 'Ponto de Reciclagem';
              }
              
              return {
                id: `osm_${element.id}`,
                name: placeName,
                address: placeAddress || 'Endereço não disponível',
                phone: element.tags?.phone || 'Não disponível',
                website: element.tags?.website,
                hours: element.tags?.['opening_hours'] || 'Horário não disponível',
                distance: distance,
                coordinates: {
                  lat: elementLat,
                  lng: elementLng
                }
              };
            })
          );

          // Filtrar nulls e ordenar por distância
          places = places.filter((place: PlaceResult | null) => place !== null) as PlaceResult[];
          places.sort((a, b) => a.distance - b.distance);
        }
      } catch (error) {
        console.error('Erro ao buscar no OpenStreetMap:', error);
      }
    }

    // Se ainda não encontrou lugares, retornar alguns locais genéricos baseados na localização
    if (places.length === 0) {
      // Buscar cidade usando reverse geocoding (nominatim)
      try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLng}`;
        const response = await fetch(nominatimUrl, {
          headers: {
            'User-Agent': 'ReciclaApp/1.0'
          }
        });
        const data = await response.json();
        const city = data.address?.city || data.address?.town || data.address?.municipality || 'sua região';

        // Retornar locais genéricos com sugestões
        places = [
          {
            id: 'generic_1',
            name: 'Coleta Seletiva Municipal',
            address: `Prefeitura de ${city}`,
            phone: '156',
            hours: 'Seg-Sex: 8h-17h',
            distance: 0,
            coordinates: { lat: userLat, lng: userLng }
          },
          {
            id: 'generic_2',
            name: 'Centro de Reciclagem',
            address: `Verifique pontos de coleta em ${city}`,
            phone: 'Não disponível',
            hours: 'Verifique horários',
            distance: 5,
            coordinates: { lat: userLat + 0.01, lng: userLng + 0.01 }
          }
        ];
      } catch (error) {
        console.error('Erro ao buscar cidade:', error);
      }
    }

    // Formatar distância para exibição
    const formattedPlaces = places.map(place => ({
      ...place,
      distance: place.distance < 1 
        ? `${Math.round(place.distance * 1000)}m`
        : `${place.distance.toFixed(1)} km`
    }));

    return NextResponse.json({ places: formattedPlaces });
  } catch (error) {
    console.error('Erro na API de locais de descarte:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar locais de descarte' },
      { status: 500 }
    );
  }
}

