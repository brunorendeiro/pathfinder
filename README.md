# Pathfinder

Visualizador interativo de algoritmos de pathfinding numa grelha: desenha
paredes, arrasta o início e o destino, escolhe um algoritmo e vê a procura
animada célula a célula até encontrar o caminho mais curto.

## Ideia

- Três algoritmos reais, não simulados: BFS, Dijkstra (com fila de
  prioridade) e A* (com heurística de distância de Manhattan).
- Grelha interativa: arrastar para desenhar/apagar paredes, arrastar os
  marcadores de início/fim para os mover.
- Painel com explicação, garantias e complexidade (Big-O) do algoritmo
  escolhido.
- Animação feita com refs diretas ao DOM (não re-render do React por célula),
  para aguentar centenas de células a animar sem engasgar.
- 100% client-side, sem backend, sem dependências além de React.

## Executar

```bash
npm install
npm run dev
```

Abrir <http://127.0.0.1:5179>.

## Validar

```bash
npm run check
npm run build
```

## Ideias para evoluir

- Gerador de labirinto (ex. recursive division).
- Pesos por célula (ex. "areia" mais lenta) para mostrar a diferença real
  entre BFS e Dijkstra.
- Tradução da interface para PT/EN/DE, como as outras apps do portfólio.

O README deve ser atualizado quando o conceito, as funcionalidades ou as
prioridades mudarem.

## Nota técnica — Google Analytics

O Analytics só é carregado depois de o utilizador aceitar os cookies. A função
`gtag` deve enviar o objeto nativo `arguments` para `dataLayer`:

```js
function gtag() {
  dataLayer.push(arguments)
}
```

Não substituir por `dataLayer.push(args)` com um rest parameter (`...args`):
apesar de o script da Google carregar, o comando `config` e o `page_view` podem
não ser processados.
