/** Idempotent EDITORIAL starter conversations — not fabricated community activity.
 * Run explicitly as an existing ADMIN; no fake users, replies, votes, or personal data.
 */
import {PrismaClient} from '@prisma/client';
if(!process.env.DATABASE_URL&&process.env.NODE_ENV!=='production')try{process.loadEnvFile('.env')}catch{}
const args=process.argv.slice(2),at=args.indexOf('--email'),email=at>=0?args[at+1]:null;
const db=new PrismaClient();
const entries=[
 {category:'experiences',title:'Вільне спілкування — знайомимось і говоримо про все',
  body:'Вітаємо у GalaxiCom! Це відкрита тема для знайомств, невимушених розмов і запитань про життя спільноти. Розкажіть, які теми вас надихають, як ви відкрили для себе Galaxiora та що хотіли б обговорити. Будь ласка, не публікуйте приватні дані.'},
 {category:'jyotish',title:'Початок знайомства з Джйотіш: що означають лагна та доми?',
  body:'Розпочнімо з основ. Як ви розумієте роль лагни в натальній карті? Які поняття Джйотіш здаються найскладнішими? Діліться загальними запитаннями та джерелами, не публікуючи власні дату, місце й час народження.'},
 {category:'tarot',title:'Таро для початківців: як ви формулюєте запитання?',
  body:'Обговорімо, як ставити відкриті й змістовні запитання під час розкладів. Що для вас важливіше: чіткий запит, контекст ситуації чи позиції карт? Приклади можна наводити без імен і приватних подробиць.'},
 {category:'practices',title:'Йога та дихання: яку щоденну практику ви любите?',
  body:'Поділіться досвідом коротких щоденних практик: дихання по квадрату, рівномірне дихання, спостереження за диханням або медитація. Які звички допомагають вам не пропускати практику?'},
 {category:'vedic',title:'Ведичні тексти: яку книгу порадили б для першого читання?',
  body:'Пропонуємо спільно зібрати добірку доступних вступних текстів про ведичну традицію, філософію і самопізнання. Напишіть назву книги, її автора та чим вона вам допомогла або здалася цікавою. Уникайте довгих цитат із захищених авторським правом книг.'},
 {category:'help',title:'Запитання про Galaxiora: що покращити насамперед?',
  body:'Ця тема для конструктивних відгуків про портал: Джйотіш, Таро, Академію, практики, персональний простір та GalaxiNews. Якої можливості бракує? Що незрозуміло в інтерфейсі? Не публікуйте паролі, електронні адреси та персональні розрахунки.'}
];
try{
 const admins=email?[]:await db.user.findMany({where:{role:'ADMIN'},take:2,
  select:{id:true,role:true,email:true},orderBy:{createdAt:'asc'}});
 if(!email&&admins.length!==1)throw Error('Choose the intended ADMIN explicitly: npm run com:seed -- --email YOUR_ADMIN_EMAIL');
 const admin=email?await db.user.findUnique({where:{email},select:{id:true,role:true,email:true}}):admins[0];
 if(!admin||admin.role!=='ADMIN')throw Error('An existing ADMIN is required; no synthetic author will be created.');
 const available=await db.comCategory.findMany({where:{enabled:true},select:{slug:true}});
 const types=new Set(available.map(x=>x.slug));
 let inserted=0,skipped=0;
 for(const item of entries){
  if(!types.has(item.category)){console.log('SKIP missing category:',item.category);skipped++;continue;}
  const existing=await db.comThread.findFirst({where:{title:item.title},select:{id:true}});
  if(existing){console.log('Already exists:',item.title);skipped++;continue;}
  const created=await db.comThread.create({data:{authorId:admin.id,categorySlug:item.category,title:item.title,
   body:item.body,status:'PUBLISHED',locked:false,pinned:false},select:{id:true}});
  console.log('CREATED',item.category,created.id,item.title);inserted++;
 }
 console.log('Editorial welcome conversations:',{inserted,skipped,author:admin.email});
 console.log('These are real ADMIN-authored invitations. No pretend reactions, quotes, votes or member histories created.');
}catch(err){console.error(err instanceof Error?err.message:String(err));process.exitCode=1}
finally{await db.$disconnect()}
