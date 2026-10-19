/** Immediate route transition feedback while Jyotish's larger client UI is loading. */
export default function LoadingJyotish(){
 return <main className="as-jyotish-loading" aria-live="polite" aria-label="Jyotish loading">
  <div className="as-loading-emblem" aria-hidden="true">✧</div>
  <p>Galaxiora · Jyotish</p>
  <h1>Завантаження натальної карти / Loading birth chart…</h1>
  <div className="as-loading-skeleton" aria-hidden="true"><span/><span/><span/></div>
 </main>;
}