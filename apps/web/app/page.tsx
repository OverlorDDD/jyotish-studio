import PortalHome from './components/PortalHome';
/** The root stays HTTP 200 for existing availability checks.
 * /en is the canonical English URL; /uk is the localized alternative. */
export default function Home(){return <PortalHome locale="en"/>;}
