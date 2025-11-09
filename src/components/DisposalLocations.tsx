'use client';

import { MapPin, Phone, Clock, Globe, Navigation, X, Recycle, Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface DisposalLocation {
  id: string;
  name: string;
  address: string;
  phone: string;
  website?: string;
  hours: string;
  distance: string | number;
  accepts?: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  rating?: number;
}

interface DisposalLocationsProps {
  material: string;
  isOpen: boolean;
  onClose: () => void;
  userLocation: { lat: number; lng: number } | null;
}

export default function DisposalLocations({ material, isOpen, onClose, userLocation }: DisposalLocationsProps) {
  const [disposalLocations, setDisposalLocations] = useState<DisposalLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userLocation) {
      fetchDisposalLocations();
    } else if (isOpen && !userLocation) {
      setError('Localização não disponível. Por favor, permita o acesso à sua localização.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userLocation, material]);

  const fetchDisposalLocations = async () => {
    if (!userLocation) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/disposal-locations?lat=${userLocation.lat}&lng=${userLocation.lng}&material=${encodeURIComponent(material)}`
      );

      if (!response.ok) {
        throw new Error('Erro ao buscar locais de descarte');
      }

      const data = await response.json();
      setDisposalLocations(data.places || []);
    } catch (err) {
      console.error('Erro ao buscar locais:', err);
      setError('Não foi possível carregar os locais de descarte. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const openMaps = (location: DisposalLocation) => {
    const url = `https://maps.google.com/maps?q=${location.coordinates.lat},${location.coordinates.lng}`;
    window.open(url, '_blank');
  };

  const callLocation = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const openWebsite = (website: string) => {
    window.open(`https://${website}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-modern">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-500/20 rounded-xl">
                <MapPin className="h-6 w-6 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Locais de Descarte</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-6 glass-card p-4 rounded-2xl border border-white/20">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-500/20 rounded-xl">
                <Recycle className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-white font-medium">Material identificado:</p>
                <p className="text-white font-bold">{material}</p>
              </div>
            </div>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 text-white animate-spin mb-4" />
              <p className="text-white text-lg">Buscando locais próximos...</p>
            </div>
          )}

          {error && (
            <div className="glass-card p-6 rounded-2xl border border-red-500/30 bg-red-500/10">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-6 w-6 text-red-300 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-300 mb-2">Erro</h4>
                  <p className="text-sm text-red-200 leading-relaxed">{error}</p>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && disposalLocations.length === 0 && (
            <div className="glass-card p-6 rounded-2xl border border-white/20">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-6 w-6 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white mb-2">Nenhum local encontrado</h4>
                  <p className="text-sm text-white leading-relaxed">
                    Não encontramos locais de descarte próximos à sua localização. Tente buscar manualmente em mapas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && disposalLocations.length > 0 && (
            <div className="space-y-6">
              {disposalLocations.map((location) => (
                <div key={location.id} className="glass-card rounded-2xl p-6 border border-white/20 shadow-modern hover:opacity-90 transition-opacity duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">{location.name}</h3>
                    <div className="glass-card px-3 py-1 rounded-full">
                      <span className="text-sm text-white font-medium">{typeof location.distance === 'string' ? location.distance : `${location.distance.toFixed(1)} km`}</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-1.5 bg-gray-500/20 rounded-lg">
                        <MapPin className="h-4 w-4 text-gray-400" />
                      </div>
                      <span className="text-sm text-white">{location.address}</span>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="p-1.5 bg-gray-500/20 rounded-lg">
                        <Clock className="h-4 w-4 text-gray-400" />
                      </div>
                      <span className="text-sm text-white">{location.hours}</span>
                    </div>

                    {location.phone && location.phone !== 'Não disponível' && (
                      <div className="flex items-center space-x-3">
                        <div className="p-1.5 bg-gray-500/20 rounded-lg">
                          <Phone className="h-4 w-4 text-gray-400" />
                        </div>
                        <span className="text-sm text-white">{location.phone}</span>
                      </div>
                    )}
                  </div>

                  {location.accepts && location.accepts.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-white mb-2 font-medium">Materiais aceitos:</p>
                      <div className="flex flex-wrap gap-2">
                        {location.accepts.map((item, itemIndex) => (
                          <span
                            key={itemIndex}
                            className="glass-card text-white text-xs px-3 py-1 rounded-full border border-white/20"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <button
                      onClick={() => openMaps(location)}
                      className="px-4 py-2 bg-gradient-to-r from-gray-800 to-gray-700 text-white rounded-lg text-sm flex items-center justify-center space-x-2 hover:opacity-80 transition-all duration-200 shadow-md hover:shadow-lg font-medium cursor-pointer"
                    >
                      <Navigation className="h-4 w-4" />
                      <span>Navegar</span>
                    </button>
                    
                    {location.phone && location.phone !== 'Não disponível' && (
                      <button
                        onClick={() => callLocation(location.phone)}
                        className="px-3 py-2 glass-card text-white rounded-lg text-sm flex items-center justify-center hover:opacity-80 transition-all duration-200 shadow-md hover:shadow-lg border border-white/20 cursor-pointer"
                      >
                        <Phone className="h-4 w-4" />
                      </button>
                    )}
                    
                    {location.website && (
                      <button
                        onClick={() => openWebsite(location.website!)}
                        className="px-3 py-2 glass-card text-white rounded-lg text-sm flex items-center justify-center hover:opacity-80 transition-all duration-200 shadow-md hover:shadow-lg border border-white/20 cursor-pointer"
                      >
                        <Globe className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && disposalLocations.length > 0 && (
            <div className="mt-8 glass-card p-6 rounded-2xl border border-white/20">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-gray-500/20 rounded-xl">
                  <span className="text-white text-lg">💡</span>
                </div>
                <div>
                  <h4 className="font-bold text-white mb-2">Dica Importante</h4>
                  <p className="text-sm text-white leading-relaxed">
                    Sempre ligue antes de se deslocar para confirmar horários e se o local aceita o tipo de material que você deseja descartar.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
