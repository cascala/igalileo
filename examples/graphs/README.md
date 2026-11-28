# Learning path: graphs and networks

Three lessons on graphs: points joined by lines, the mathematics behind road maps, timetables, social networks and
the web. Each lesson opens with a real question (the bridges of Königsberg, the fastest route from Den Haag to
Arnhem, why the Medici came to rule Florence), builds the idea on graphs small enough to check by hand, and lets
Galileo do the larger cases. Every section ends with a **Try this**; exercises with hints and answers close each
lesson.

| # | Notebook | What you learn |
|---|---|---|
| 0 | [Simplify and eval](00-simplify-and-eval.ipynb) | exact answers, `eval` for digits, and the `calc` setting: work answers out, give digits, or keep input as typed |
| 1 | [Graphs, degrees and tours](01-graphs-and-tours.ipynb) | graphs as edge lists, degrees and the handshake lemma, counting walks with the adjacency matrix, Euler's bridges of Königsberg, Hamiltonian cycles, connected and bipartite graphs |
| 2 | [Shortest paths, trees, flows and matchings](02-paths-trees-and-flows.ipynb) | Dijkstra's algorithm and breadth-first search, minimum spanning trees and Kirchhoff's tree count, maximum flow and minimum cut, matchings and Hall's theorem |
| 3 | [Colorings, orderings and real networks](03-colorings-orderings-and-networks.ipynb) | scheduling by coloring, the chromatic number and polynomial, the four color theorem, topological order, betweenness and PageRank, random graphs and the connectivity threshold |

Prerequisites: none for lesson 1 beyond arithmetic; matrix multiplication
([linear algebra 1](../linear-algebra/01-vectors-and-matrices.ipynb)) helps in its section 3.

Commands introduced: `graph`, `digraph`, `complete`, `cycle`, `path`, `star`, `wheel`, `grid`, `hypercube`,
`petersen`, `randgraph`, `order`, `size`, `vertices`, `edges`, `degree`, `neighbors`, `adjacency`, `laplacian`,
`subgraph`, `complement`, `isconnected`, `components`, `isbipartite`, `istree`, `bfs`, `dfs`, `shortest`, `dist`,
`diameter`, `mst`, `spanningtrees`, `maxflow`, `mincut`, `matching`, `coloring`, `chromatic`, `chromaticpoly`,
`eulerian`, `hamiltonian`, `toposort`, `centrality`, `pagerank`, `draw`. `help(name)` describes each one.

The notebooks are generated from the plain-text sources in [`../src/graphs`](../src/graphs) by
`python3 examples/src/build.py`, then executed so that results and plots are stored with them.
