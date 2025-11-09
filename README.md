# ReciclaApp

Um aplicativo Next.js para análise de materiais recicláveis através de câmera do celular, com foco em sustentabilidade e descarte correto.

## 🚀 Características

- **Análise por Câmera**: Capture fotos de materiais para análise instantânea
- **Banco de Dados Especializado**: Focado exclusivamente em reciclagem e descarte
- **Sistema de Planos**: Plano gratuito com limite diário e planos premium ilimitados
- **Conexão com Instituições**: Encontre pontos de descarte próximos
- **Interface Moderna**: Design responsivo com paleta preto/cinza/branco e fonte Poppins
- **Turbopack**: Build rápido e desenvolvimento otimizado

## 🛠️ Tecnologias

- **Next.js 15** com App Router
- **TypeScript** para type safety
- **Tailwind CSS 4** para estilização
- **Turbopack** para build otimizado
- **Google Vision API** para análise de imagens (configuração necessária)
- **Lucide React** para ícones

## 📱 Funcionalidades

### Análise de Materiais
- Captura de imagens via câmera ou upload
- Identificação de materiais recicláveis
- Informações sobre como descartar corretamente
- Nível de confiança da análise

### Sistema de Planos
- **Gratuito**: 5 análises por dia
- **Premium Mensal**: R$ 9,90/mês - Análises ilimitadas
- **Premium Anual**: R$ 99,90/ano - Análises ilimitadas (16% de desconto)

### Conexão com Instituições
- Localização de pontos de descarte próximos
- Informações de contato e horários
- Integração com mapas para navegação
- Lista de materiais aceitos por local

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Conta no Google Cloud Platform (para Vision API)

### Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd recicla-app
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` com suas credenciais:
```env
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=sua-api-key-aqui
```

4. Execute o projeto em modo desenvolvimento:
```bash
npm run dev
```

O aplicativo estará disponível em [http://localhost:3000](http://localhost:3000)

## 🔧 Configuração da Google Vision API

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a API do Google Vision
4. Crie uma conta de serviço e baixe o arquivo JSON de credenciais
5. Configure a variável `GOOGLE_APPLICATION_CREDENTIALS` com o caminho do arquivo

## 📁 Estrutura do Projeto

```
recicla-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── analyze/          # API para análise de imagens
│   │   ├── globals.css           # Estilos globais
│   │   ├── layout.tsx            # Layout principal
│   │   └── page.tsx              # Página principal
│   └── components/
│       ├── UpgradeModal.tsx      # Modal de upgrade
│       └── DisposalLocations.tsx # Modal de locais de descarte
├── public/                       # Arquivos estáticos
├── tailwind.config.ts           # Configuração do Tailwind
├── next.config.ts               # Configuração do Next.js
└── package.json
```

## 🎨 Design System

### Paleta de Cores
- **Preto**: #171717 (texto principal)
- **Cinza**: Escala de cinzas do Tailwind (50-950)
- **Branco**: #FFFFFF (fundo)

### Tipografia
- **Fonte Principal**: Poppins (Google Fonts)
- **Pesos**: 100-900 (incluindo itálico)

### Componentes
- Cards com sombras suaves
- Botões com estados hover
- Modais responsivos
- Ícones do Lucide React

## 🔮 Funcionalidades Futuras

- [ ] Integração real com Google Vision API
- [ ] Sistema de pagamento (Stripe)
- [ ] Histórico de análises
- [ ] Notificações push
- [ ] Gamificação (pontos por reciclagem)
- [ ] Modo offline
- [ ] Múltiplos idiomas
- [ ] Dashboard de estatísticas

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte, envie um email para suporte@reciclaapp.com ou abra uma issue no GitHub.

---

Feito com ❤️ para um mundo mais sustentável 🌱