# CodexTrader V1 — Estudo de caso

**Wellington da Silva** | [GitHub: Velts-Opera](https://github.com/Velts-Opera)

## O desafio

Desenvolver uma aplicação web capaz de consultar dados de mercado, apresentar indicadores quantitativos e explorar estratégias de negociação com controles de risco mensuráveis — sem confundir resultados simulados com desempenho real.

## O que estou construindo

- **Backend TypeScript/Express:** rotas de leitura de cotações e candles da API pública Binance Spot, com validação de respostas e tratamento de indisponibilidade.
- **Frontend React/Vite:** interface para acompanhar mercados, inspecionar preços e consultar gráficos.
- **Motor de risco:** regras para stop-loss, exposição máxima, limites de perdas e parada emergencial.
- **Simulador de ordens:** protótipo de fluxo de negociação sem enviar ordens reais à corretora.
- **Testes e CI:** testes unitários no projeto e workflow de verificação de compilação, tipos e testes (resultados ainda sujeitos à execução do GitHub Actions).

## Decisões técnicas

1. **Dados verificáveis:** não apresentar preços fabricados como cotações atuais.
2. **Falha segura:** um serviço indisponível não deve produzir recomendações fictícias.
3. **Risco separado da análise:** nenhum parecer externo pode autorizar ordens sem passar por validações determinísticas.
4. **Execução demonstrativa por padrão:** sem envio de ordens reais nesta etapa.
5. **Documentação transparente:** diferenciar claramente funcionalidades existentes, experimentais e planejadas.

## Tecnologias

TypeScript, React, Vite, Node.js, Express, APIs REST, Git/GitHub, testes automatizados; Supabase e Gemini como módulos opcionais em avaliação.

## Status do projeto

**Em desenvolvimento e validação.** A branch contém implementações e testes que precisam passar por execução integrada antes de qualquer alegação de estabilidade operacional.

## Demonstração e contato

Código-fonte: https://github.com/Velts-Opera/Velts-trader-ai/tree/codextrader-v1-safety

Para conversar sobre desenvolvimento, integrações, automação e evolução do projeto, entre em contato pelo perfil do GitHub.

---

> Projeto de engenharia de software e estudo de sistemas de mercado. Não há garantia de lucro nem autorização para operar valores reais nesta versão.
