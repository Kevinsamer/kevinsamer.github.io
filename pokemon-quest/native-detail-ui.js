/** Native bingo-line rectangles, ordered rows 0..2 then columns 0..2.
 * Supply completed lines computed from the engine's source slot topology.
 * Use alongside native-detail-layout.css; inactive overlays remain hidden.
 */
export function nativeBingoLines(completed = []) {
  return Array.from({length:6}, (_, i) => `<span class="native-bingo-line" data-line="${i}" aria-hidden="true"${completed[i] ? '' : ' hidden'}></span>`).join('');
}
