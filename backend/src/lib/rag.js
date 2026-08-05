// lanchain/ is an ESM package (pdfjs-dist, @huggingface/transformers, etc.
// are ESM-only), so it's loaded from this CommonJS backend via a cached
// dynamic import rather than require().
let ragPromise;

function loadRag() {
  if (!ragPromise) {
    ragPromise = import('../../../lanchain/src/index.js');
  }
  return ragPromise;
}

module.exports = { loadRag };
