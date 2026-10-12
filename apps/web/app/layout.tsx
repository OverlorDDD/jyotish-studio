import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Jyotish Studio | Vedic Chart Engine',description:'Deterministic Lahiri D1 D9 D10 chart calculations, Vimshottari periods and AI interpretation.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
