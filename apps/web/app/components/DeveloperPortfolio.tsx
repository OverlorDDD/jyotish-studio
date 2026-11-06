import Link from 'next/link';
import {ArrowUpRight,Download,ExternalLink,Mail,Code2,Database,Cloud,BrainCircuit,BriefcaseBusiness,GraduationCap,Github,Linkedin,Globe2} from 'lucide-react';
import profile from '../../lib/portfolio-profile.json';
import type {PortalLocale} from '../../lib/brand';

const ICONS=[Code2,Database,Cloud,BrainCircuit] as const;
export default function DeveloperPortfolio({locale}:{locale:PortalLocale}){
 const p=profile[locale],c=profile.contact;
 const pdf='/resume/denys-avramenko-cv.'+locale+'.pdf';
 const docx='/resume/denys-avramenko-cv.'+locale+'.docx';
 return <article className="dp-page">
  <section className="dp-hero" aria-labelledby="dp-title">
   <div className="dp-hero-inner">
    <span className="dp-eyebrow"><span className="dp-live-dot" aria-hidden="true"/> {locale==='uk'?'ВІДКРИТИЙ ДО ПРОПОЗИЦІЙ':'OPEN TO OPPORTUNITIES'} · FULL-STACK ENGINEERING</span>
    <p className="dp-name">{locale==='uk'?c.nameUk:c.nameEn}</p>
    <h1 id="dp-title">{p.tagline}</h1>
    <p className="dp-role">{p.title}<span aria-hidden="true"> / </span>{p.subtitle}</p>
    <p className="dp-intro">{p.intro}</p>
    <nav className="dp-hero-actions" aria-label={p.labels.resume}>
     <a className="dp-button dp-primary" href={pdf} download><Download size={17} aria-hidden="true"/>{p.ctaPdf}</a>
     <a className="dp-button dp-secondary" href={docx} download><Download size={17} aria-hidden="true"/>{p.ctaWord}</a>
     <a className="dp-button dp-link" href="#open-works">{p.ctaWork}<ArrowUpRight size={17} aria-hidden="true"/></a>
    </nav>
    <div className="dp-socials" aria-label={p.linksLabel}>
     <a href={c.github} target="_blank" rel="noopener noreferrer"><Github size={17} aria-hidden="true"/>GitHub<ExternalLink size={12} aria-hidden="true"/></a>
     <a href={c.linkedin} target="_blank" rel="noopener noreferrer"><Linkedin size={17} aria-hidden="true"/>LinkedIn<ExternalLink size={12} aria-hidden="true"/></a>
     <a href={c.website} target="_blank" rel="noopener noreferrer"><Globe2 size={17} aria-hidden="true"/>Galaxiora<ExternalLink size={12} aria-hidden="true"/></a>
    </div>
   </div>
   <div className="dp-hero-visual" aria-hidden="true">
    <div className="dp-orbit dp-orbit-one"/><div className="dp-orbit dp-orbit-two"/>
    <div className="dp-code-pane">
     <span className="dp-code-dots"><i/><i/><i/></span>
     <code><span>const</span> engineer = {'{'}<br/>
     &nbsp; focus: <em>'products'</em>,<br/>
     &nbsp; stack: [<em>'TS'</em>, <em>'Next'</em>, <em>'Nest'</em>],<br/>
     &nbsp; approach: <em>'ship &amp; verify'</em><br/>
     {'}'}</code>
    </div>
   </div>
  </section>
  <div className="dp-body">
   <section className="dp-intro-section" aria-labelledby="dp-profile-title">
    <span className="dp-section-count">01 / PROFILE</span>
    <h2 id="dp-profile-title">{p.title}</h2><p>{p.profile}</p>
   </section>

   <section className="dp-section" aria-labelledby="dp-expertise-title">
    <div className="dp-section-heading"><span className="dp-section-count">02 / EXPERTISE</span><h2 id="dp-expertise-title">{p.sectionExpertise}</h2></div>
    <div className="dp-expertise-grid">
     {p.expertise.map((item,index)=>{
      const Icon=ICONS[index]||Code2;
      return <div className="dp-skill-card" key={item.title}>
       <div className="dp-card-icon"><Icon size={21} aria-hidden="true"/></div>
       <h3>{item.title}</h3><p>{item.description}</p>
      </div>;
     })}
    </div>
    <div className="dp-stack" aria-label={p.labels.skills}>
     {p.skills.map(s=><div key={s.label}><strong>{s.label}</strong><span>{s.value}</span></div>)}
    </div>
   </section>

   <section className="dp-section" id="open-works" aria-labelledby="dp-works-title">
    <div className="dp-section-heading"><span className="dp-section-count">03 / SELECTED WORK</span><h2 id="dp-works-title">{p.sectionWorks}</h2></div>
    <div className="dp-projects">
     {p.projects.map((project,index)=><article className="dp-project" key={project.name}>
      <div className="dp-project-number">0{index+1}</div>
      <div className="dp-project-main"><p className="dp-project-kind">{project.kind} · {project.period}</p>
       <h3>{project.name}</h3><p className="dp-project-description">{project.intro}</p>
       <ul>{project.details.map(d=><li key={d}>{d}</li>)}</ul>
       <nav className="dp-project-links" aria-label={project.name}>
        {'live' in project && typeof project.live==='string'&&<a href={project.live} target="_blank" rel="noopener noreferrer">{p.labels.live}<ArrowUpRight size={15} aria-hidden="true"/></a>}
        <a href={project.code} target="_blank" rel="noopener noreferrer">{p.labels.code}<ArrowUpRight size={15} aria-hidden="true"/></a>
       </nav>
      </div>
     </article>)}
    </div>
   </section>
   <aside className="dp-startup" aria-labelledby="dp-startup-title">
    <div><span className="dp-section-count">GALAXIORA · COMMUNITY STARTUP</span><h2 id="dp-startup-title">{p.startupTitle}</h2><p>{p.startupText}</p>
    <p className="dp-startup-small">{p.startupSupport}</p></div>
    <Link className="dp-button dp-primary" href={'/'+locale+'/about'}>{p.startupButton}<ArrowUpRight size={17} aria-hidden="true"/></Link>
   </aside>
   <section className="dp-section" aria-labelledby="dp-career-title">
    <div className="dp-section-heading"><span className="dp-section-count">04 / CAREER</span><h2 id="dp-career-title">{p.sectionCareer}</h2></div>
    <div className="dp-career-grid">
     <div className="dp-career-card"><h3><BriefcaseBusiness size={20} aria-hidden="true"/>{p.labels.experience}</h3>
      {p.experience.map(e=><div className="dp-timeline" key={e.title}>
       <span>{e.period}</span><h4>{e.title}</h4>
       <ul>{e.details.map(d=><li key={d}>{d}</li>)}</ul>
      </div>)}
     </div>
     <div className="dp-career-card"><h3><GraduationCap size={20} aria-hidden="true"/>{p.labels.education}</h3>
      <p>{p.education}</p><h3 className="dp-languages">{p.labels.languages}</h3><p>{p.languages}</p>
     </div>
    </div>
   </section>
   <section className="dp-contact" id="contact" aria-labelledby="dp-contact-title">
    <span className="dp-section-count">05 / CONTACT</span>
    <h2 id="dp-contact-title">{p.sectionContact}</h2><p>{p.contactText}</p>
    <a className="dp-button dp-primary" href={'mailto:'+c.email}><Mail size={17} aria-hidden="true"/>{p.ctaContact}</a>
    <p><a href={'mailto:'+c.email}>{c.email}</a> · <a href={'tel:'+c.phone.replace(/\s/g,'')}>{c.phone}</a></p>
   </section>
  </div>
 </article>;
}
