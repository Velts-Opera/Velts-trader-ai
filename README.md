# CodexTrader V1 | Velts

**Projeto de Wellington da Silva**  
Desenvolvimento e direção do produto: **Wellington da Silva**  
GitHub: [Velts-Opera](https://github.com/Velts-Opera)

Plataforma em desenvolvimento para acompanhamento de mercados, análise quantitativa de criptomoedas, gestão de risco e simulação de operações.

## Visão geral

O CodexTrader V1 está sendo desenvolvido como uma aplicação web de análise e monitoramento de oportunidades de negociação. O objetivo é combinar dados verificáveis de mercado, indicadores técnicos e controles de risco antes de considerar qualquer execução com capital real.

**Estado atual:** protótipo em desenvolvimento. Não é um robô de negociação real pronto para produção. O módulo de execução utiliza *paper trading* (simulação) e as estratégias automatizadas não estão habilitadas para operações reais.

## Funcionalidades implementadas ou em desenvolvimento

- **Integração somente leitura com a API pública da Binance Spot:** endpoints para cotações e candles de BTC/USDT, ETH/USDT, SOL/USDT e BNB/USDT; não requer chave de API para os dados públicos.
- **Dashboard:** interface React para visualizar ativos, estratégias e posições simuladas.
- **Gestão determinística de risco:** validação de entradas, exigência de stop-loss, tamanho máximo de posição, limites de perda e parada emergencial.
- **Simulador:** motor de ordens fictícias para ensaiar fluxos de operação sem enviar ordens à corretora.
- **Análise técnica:** componentes para indicadores como RSI, médias móveis, MACD e volatilidade.
- **Análise assistida opcional:** o protótipo contém integração experimental com Google Gemini; essa funcionalidade depende de credenciais, tem custo potencial e ainda requer validação. O modelo não substitui o motor de risco.

### Arquitetura

```text
Binance Spot (dados públicos)
             |
    API Express / TypeScript
             |
  Dashboard React + Vite
             |
  Indicadores e estratégias
             |
 Gerenciador de risco
             |
 Simulador de ordens (paper)
```

## Tecnologias

TypeScript · React · Vite · Node.js · Express · APIs REST · testes automatizados · Supabase (opcional) · Google Gemini (integração experimental opcional).

## Executar localmente

Pré-requisito: Node.js compatível com o projeto.

```bash
git clone https://github.com/Velts-Opera/Velts-trader-ai.git
cd Velts-trader-ai
git checkout codextrader-v1-safety
npm install
npm run dev
```

No navegador, acesse `http://localhost:3000`.

Para verificar o código:

```bash
npm run lint
npm test
npm run build
```

**Atenção:** a execução desses comandos e o comportamento integrado da nova branch ainda precisam ser validados. Não há garantia de funcionamento em produção.

### Endpoints públicos do backend

- `GET /api/market/binance/status` — informações da integração somente leitura.
- `GET /api/market/binance/quotes` — cotações de quatro pares à vista.
- `GET /api/market/binance/candles?symbol=BTCUSDT&interval=5m&limit=200` — candles reais.

Falhas da API retornam erro: o backend não fabrica cotações como alternativa.

## Segurança e limitações

- **Sem ordens reais:** nenhum endpoint implementado nesta etapa envia ordens à Binance.
- **Sem alavancagem nesta fase.**
- **Sem promessa de rentabilidade:** indicadores e sinais exigem validação estatística e observação de resultados líquidos de custos.
- **Dados não-cripto na interface legada:** partes do protótipo ainda exibem dados demonstrativos e devem ser identificadas como tal antes de uma apresentação comercial.
- **Não adicione credenciais a arquivos versionados.** Use variáveis de ambiente e nunca publique tokens no GitHub.

## Próximas etapas

1. Revisar e testar a integração Binance, incluindo tratamento de indisponibilidade e dados desatualizados.
2. Alimentar os gráficos e indicadores exclusivamente com candles reais.
3. Remover conteúdos fictícios e métricas não verificadas da interface.
4. Testar estratégias com dados históricos e simulação, considerando taxas e deslizamento.
5. Validar controles operacionais antes de qualquer proposta de execução real.

---

### Autoria e apresentação

**Wellington da Silva** — idealização, desenvolvimento do produto e evolução do projeto CodexTrader V1, no ecossistema Velts.

Este repositório apresenta um trabalho em evolução. Tecnologias utilizadas, contribuições e estágio de maturidade são descritos de forma transparente para avaliação técnica.

**Aviso:** material de engenharia de software e pesquisa em mercados, não recomendação de investimento.
