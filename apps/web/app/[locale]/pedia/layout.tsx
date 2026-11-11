import '../../pedia.css';

// Load GalaxiPedia styles only for /en/pedia and /uk/pedia route segments,
// not for the home page, natal calculator or the rest of the website.
export default function PediaLayout({children}:{children:React.ReactNode}){
 return children;
}
