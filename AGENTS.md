# AGENTS.md

## Objetivo

Este projeto contém exclusivamente a app Pathfinder, um visualizador de
algoritmos de procura de caminho.

## Regras

- Manter a app 100% client-side: sem backend, sem tracking, sem login.
- Os algoritmos em `src/data/algorithms.ts` são implementações reais
  (fila de prioridade, heurística), não animações pré-cozinhadas —
  qualquer alteração tem de preservar isso.
- A animação usa refs diretas ao DOM por performance; não voltar a
  fazê-la via `setState` por célula sem confirmar que não degrada com
  grelhas grandes.
- Não colocar aqui código do portfólio ou de outras aplicações.

## Validação

```bash
npm run check
npm run build
```
