import {hubMetadata,renderHub} from '../../../../lib/horoscope-page';
export const dynamic='force-dynamic';
type Props={params:Promise<{locale:string}>};
export async function generateMetadata({params}:Props){return hubMetadata((await params).locale,'vedic');}
export default async function VedicHoroscopePage({params}:Props){return renderHub((await params).locale,'vedic');}
