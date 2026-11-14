export function TabAyuda() {
  const bloque = 'mb-4 text-sm text-slate-700 dark:text-slate-300';
  return (
    <div>
      <h3 className="mb-1 font-semibold">¿Cómo se usa?</h3>
      <ol className={`${bloque} list-decimal space-y-1 pl-5`}>
        <li>Haga clic en un lugar del mapa: el primer clic fija el <strong>origen</strong> (círculo verde «O») y el segundo el <strong>destino</strong> (cuadro rojo «D»).</li>
        <li>En <strong>Ruta</strong> ajuste los sliders α, β y γ o use un preajuste. La ruta se dibuja animada en azul.</li>
        <li>En <strong>Isócronas</strong> elija un tiempo máximo y vea la zona alcanzable en amarillo.</li>
        <li>En <strong>Matrices</strong> consulte M, D, T, E y la matriz de costos C.</li>
        <li>En <strong>Accesibilidad</strong> cuente recorridos de k tramos y compruebe si el mapa es conexo.</li>
        <li>En <strong>Ejemplos</strong> verifique los tres ejercicios del Avance 1.</li>
        <li>En <strong>Editor</strong> agregue o elimine lugares y calles, o edite sus valores.</li>
      </ol>
      <h3 className="mb-1 font-semibold">Modelo matemático</h3>
      <ul className={`${bloque} list-disc space-y-1 pl-5`}>
        <li>Lugares = vértices; calles = aristas de un grafo no dirigido.</li>
        <li>M es la matriz de adyacencia (0/1). Las entradas de Mᵏ cuentan recorridos de exactamente k tramos.</li>
        <li>D, T y E son matrices ponderadas (∞ sin calle directa, 0 en la diagonal).</li>
        <li>C = α·D′ + β·T′ + γ·E′ con α + β + γ = 1 y X′ = X / máx(X).</li>
        <li>La ruta óptima se obtiene con Dijkstra sobre C; las isócronas, con Dijkstra sobre T.</li>
        <li>R = I + M + … + Mⁿ⁻¹; el grafo es conexo si todos los r<sub>ij</sub> son positivos.</li>
      </ul>
      <p className="text-xs text-slate-500">Los valores de distancia, tiempo y esfuerzo del mapa de Costa Rica son ilustrativos, no mediciones reales.</p>
    </div>
  );
}
