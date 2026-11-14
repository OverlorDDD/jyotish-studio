import {renderSign,signMetadata} from '../../../../../lib/horoscope-page';
export const dynamic='force-dynamic';
type Props={params:Promise<{locale:string;sign:string}>};
export async function generateMetadata({params}:Props){const p=await params;return signMetadata(p.locale,'vedic',p.sign);}
export default async function VedicSignPage({params}:Props){const p=await params;return renderSign(p.locale,'vedic',p.sign);}
