import {renderSign,signMetadata} from '../../../../../lib/horoscope-page';
export const dynamic='force-dynamic';
type Props={params:Promise<{locale:string;sign:string;period:string}>};
export async function generateMetadata({params}:Props){const p=await params;return signMetadata(p.locale,'western',p.sign,p.period);}
export default async function SignPeriodPage({params}:Props){const p=await params;return renderSign(p.locale,'western',p.sign,p.period);}
