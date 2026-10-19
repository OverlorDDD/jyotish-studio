/** A5 original editorial practices. No user health data, accounts, provider AI or CMS. */
export type ContentLocale='uk'|'en';
export type Bilingual={uk:string;en:string};
export type YogaStep={name:Bilingual;guide:Bilingual;seconds:number;alternative:Bilingual};
export type YogaPractice={slug:string;title:Bilingual;subtitle:Bilingual;purpose:Bilingual;
 category:'breathing'|'mobility'|'meditation';icon:'wind'|'sun'|'moon'|'leaf';
 preparation:Bilingual;safety:Bilingual;steps:YogaStep[]};
export const say=(value:Bilingual,locale:ContentLocale)=>value[locale];
export const YOGA_PRACTICES:YogaPractice[]=[
 {slug:'gentle-breath',category:'breathing',icon:'wind',
  title:{uk:'Дихання без поспіху',en:'Unhurried breathing'},
  subtitle:{uk:'4 хв · дихання по квадрату 4–4–4–4',en:'4 min · box breathing 4–4–4–4'},
  purpose:{uk:'Анімований квадрат веде через вдих, паузу після вдиху, видих і паузу після видиху. Є також техніки без затримок.',en:'A visual square guides inhale, hold after inhale, exhale and hold after exhale. No-hold alternatives are available.'},
  preparation:{uk:'Сядь з опорою для спини. Поклади долоню нижче ребер: на м’якому вдиху живіт дещо розширюється, на видиху природно опускається. Починай лише коли готовий(-а).',en:'Sit with your back supported. Place a hand below your ribs: let your belly rise softly on inhale and settle on exhale. Begin only when ready.'},
  safety:{uk:'Дихання по квадрату містить чотирисекундні паузи. Вони не обов’язкові: обери режим без затримок, якщо відчуваєш дискомфорт. Не форсуй дихання; при запамороченні чи задишці зупинись.',en:'Box breathing includes four-second holds, but holds are optional. Choose a no-hold pattern if uncomfortable. Do not force breath depth; stop for dizziness or breathlessness.'},
  // The visual breathing pacer owns all phase durations; these are editorial phase cues only.
  steps:[
   {seconds:4,name:{uk:'Вдих',en:'Inhale'},guide:{uk:'Живіт м’яко розширюється під долонею, без зусилля.',en:'Let the belly gently rise under your hand without forcing.'},alternative:{uk:'Обери інший комфортний ритм.',en:'Choose a comfortable breathing rhythm.'}},
   {seconds:4,name:{uk:'Пауза після вдиху',en:'Hold after inhale'},guide:{uk:'Не набирай більше повітря; залишайся без напруження.',en:'Avoid taking in extra air or adding tension.'},alternative:{uk:'Якщо незручно — режим без затримок.',en:'Use a no-hold pattern if needed.'}},
   {seconds:4,name:{uk:'Видих',en:'Exhale'},guide:{uk:'М’яко видихай, живіт повертається до нейтрального стану.',en:'Exhale gently as your belly settles.'},alternative:{uk:'Не видихай силою.',en:'Do not force the exhale.'}},
   {seconds:4,name:{uk:'Пауза після видиху',en:'Hold after exhale'},guide:{uk:'Пауза коротка й лише за комфорту.',en:'Pause briefly only if comfortable.'},alternative:{uk:'Пропусти паузу в іншій техніці.',en:'Choose a no-hold technique.'}}

  ]},
 {slug:'desk-mobility',category:'mobility',icon:'sun',
  title:{uk:'Розминка за столом',en:'Desk-friendly mobility'},
  subtitle:{uk:'6 хв · шия, плечі, кисті',en:'6 min · neck, shoulders, wrists'},
  purpose:{uk:'М’які рухи у звичайній комфортній амплітуді після сидіння за комп’ютером.',en:'Gentle movements within your comfortable range after sitting at a screen.'},
  preparation:{uk:'Візьми стійкий стілець. Тримай рухи невеликими; біль не є метою практики.',en:'Use a stable chair. Keep movements small; pain is never the goal.'},
  safety:{uk:'Не розтягуй через біль, не закидай голову різко назад. За травм, обмежень рухливості чи вагітності обирай індивідуальні рекомендації фахівця.',en:'Never stretch into pain or sharply tip the head back. For injuries, mobility limitations or pregnancy, seek individualized guidance.'},
  steps:[
   {seconds:45,name:{uk:'Відчуй опору',en:'Find support'},guide:{uk:'Постав стопи на підлогу. Випрямися настільки, наскільки зручно, без напруження.',en:'Place feet on the ground. Sit as upright as is comfortable, without bracing.'},alternative:{uk:'Можна виконувати стоячи.',en:'Standing is an option.'}},
   {seconds:75,name:{uk:'Плечі колами',en:'Shoulder circles'},guide:{uk:'Повільно підіймай плечі, веди назад і опускай. Чергуй напрямок без поспіху.',en:'Slowly lift, roll back, and lower your shoulders. Reverse direction without rushing.'},alternative:{uk:'Можна лише легенько зводити й розводити лопатки.',en:'Try gentle shoulder-blade squeezes instead.'}},
   {seconds:75,name:{uk:'Повороти голови',en:'Gentle head turns'},guide:{uk:'Поверни погляд трохи ліворуч, потім праворуч. Шия довга, жодного тиску руками.',en:'Look slightly left and then right. Keep the neck long and never pull with your hands.'},alternative:{uk:'За дискомфорту рухай лише очима.',en:'Move only your eyes if your neck feels uncomfortable.'}},
   {seconds:75,name:{uk:'Кисті та пальці',en:'Hands and wrists'},guide:{uk:'Розкрий долоні, м’яко стисни пальці, зроби невеликі кола кистями.',en:'Open your hands, gently curl the fingers and make small wrist circles.'},alternative:{uk:'За болю пропусти рух, просто розслаб долоні.',en:'Skip the movement if it hurts; rest your hands instead.'}},
   {seconds:60,name:{uk:'Рухи спиною',en:'Seated back movement'},guide:{uk:'На видиху трохи округли спину, на вдиху повернись у нейтральне положення. Без глибоких прогинів.',en:'Round your upper back slightly as you exhale; return to neutral on an inhale. No deep arching.'},alternative:{uk:'Можна лише змінювати положення плечей.',en:'You can move only your shoulders.'}},
   {seconds:30,name:{uk:'Маленька пауза',en:'Pause and notice'},guide:{uk:'Зупинися, відчуй опору й обери комфортне положення для подальшої роботи.',en:'Pause, feel your support, and choose a comfortable position for the next task.'},alternative:{uk:'За бажанням просто відпочинь.',en:'Simply rest if you prefer.'}}
  ]},
 {slug:'five-senses',category:'meditation',icon:'leaf',
  title:{uk:'П’ять відчуттів',en:'Five senses grounding'},
  subtitle:{uk:'5 хв · уважність до теперішнього',en:'5 min · present-moment awareness'},
  purpose:{uk:'Помічай те, що довкола, без оцінювання своїх думок чи відчуттів.',en:'Notice your surroundings without judging your thoughts or sensations.'},
  preparation:{uk:'Обери спокійне місце, де ти в безпеці. Очі можуть бути відкритими весь час.',en:'Choose a place where you feel safe. You can keep your eyes open throughout.'},
  safety:{uk:'Якщо зосередження на тілі або відчуттях викликає дискомфорт, зупинись чи обери іншу практику.',en:'If body- or sense-focused attention feels uncomfortable, stop or choose another practice.'},
  steps:[
   {seconds:60,name:{uk:'Що ти бачиш?',en:'What can you see?'},guide:{uk:'Спокійно роздивись п’ять предметів: колір, форму, світло. Не потрібно шукати нічого особливого.',en:'Notice five objects: their colors, shapes and light. Nothing special needs to happen.'},alternative:{uk:'Достатньо одного предмета.',en:'One object is enough.'}},
   {seconds:60,name:{uk:'Що ти чуєш?',en:'What can you hear?'},guide:{uk:'Зверни увагу на звуки — близькі або далекі — і дай їм бути.',en:'Notice nearby or distant sounds and let them be.'},alternative:{uk:'Якщо навколо шумно, відміть один сталий звук.',en:'If it is noisy, choose one steady sound.'}},
   {seconds:60,name:{uk:'Контакт і текстури',en:'Touch and textures'},guide:{uk:'Поміть дотик одягу, поверхню стільця або температуру рук.',en:'Notice your clothing, the chair, or the temperature of your hands.'},alternative:{uk:'Можна торкнутися предмета на столі.',en:'Touch an object on your desk instead.'}},
   {seconds:60,name:{uk:'Запахи і смаки',en:'Smell and taste'},guide:{uk:'Чи помічаєш якийсь запах або смак? Відсутність відчуття — теж нормальна відповідь.',en:'Do you notice any scent or taste? Not noticing anything is also fine.'},alternative:{uk:'Заміни крок спостереженням за світлом.',en:'Notice the light in the room instead.'}},
   {seconds:60,name:{uk:'Поверни увагу',en:'Return gently'},guide:{uk:'Подивись довкола й виріши, яку маленьку наступну дію хочеш зробити.',en:'Look around and choose one small action for what comes next.'},alternative:{uk:'Просто завершити — теж вибір.',en:'Simply finishing is also a choice.'}}
  ]},
 {slug:'evening-unwind',category:'meditation',icon:'moon',
  title:{uk:'Тиха вечірня пауза',en:'Evening unwind'},
  subtitle:{uk:'7 хв · спокійна рефлексія',en:'7 min · quiet reflection'},
  purpose:{uk:'Простір для завершення дня без обіцянок швидкого засинання чи «очищення» думок.',en:'A gentle transition out of the day, without promises of sleep or clearing your thoughts.'},
  preparation:{uk:'Обери зручну позу сидячи або лежачи, залиш комфортне освітлення.',en:'Sit or lie comfortably and keep any lighting you prefer.'},
  safety:{uk:'Не практикуй у ситуації, де потрібно бути уважним до дороги чи механізмів. Тривога зростає — повернись до звичайної діяльності.',en:'Do not practice while driving or operating equipment. Return to everyday activity if distress increases.'},
  steps:[
   {seconds:60,name:{uk:'Місце для спокою',en:'Create a quiet spot'},guide:{uk:'Влаштуйся й відчуй опору. Не потрібно змінювати дихання.',en:'Settle and feel the support underneath. You do not need to change your breathing.'},alternative:{uk:'Сядь замість лежання, якщо так зручніше.',en:'Sit rather than lie down if that is more comfortable.'}},
   {seconds:90,name:{uk:'Поміть напруження',en:'Notice tension'},guide:{uk:'Зверни увагу на плечі, руки і обличчя. Не примушуй м’язи розслабитися.',en:'Notice your shoulders, hands and face. Do not force the muscles to relax.'},alternative:{uk:'Перенеси увагу на звуки, якщо відчуття тіла незручні.',en:'Use sounds instead of body sensations if you prefer.'}},
   {seconds:90,name:{uk:'Назви одну подію',en:'Recall one moment'},guide:{uk:'Згадай одну буденну подію дня. Опиши її для себе без оцінки «добре» чи «погано».',en:'Recall one ordinary moment from today. Describe it without labeling it good or bad.'},alternative:{uk:'Можна пригадати приємне місце.',en:'You can picture a comfortable place instead.'}},
   {seconds:90,name:{uk:'Залиши незавершене',en:'Let unfinished things wait'},guide:{uk:'Поміть одну справу, яку можна залишити на завтра. Подумки скажи: «До цього я повернуся пізніше».',en:'Notice one task that can wait. Silently say: “I can return to this later.”'},alternative:{uk:'Якщо справи тривожать, пропусти цей крок.',en:'Skip this if thinking about tasks is stressful.'}},
   {seconds:90,name:{uk:'Повільне завершення',en:'Finish at your own pace'},guide:{uk:'Відчуй простір навколо. Зроби невеликий рух пальцями й повернись до вечора.',en:'Notice the room. Make a small movement with your fingers and return to your evening.'},alternative:{uk:'Можеш завершити в будь-який момент.',en:'You can finish at any point.'}}
  ]}
];
export const yogaBySlug=(slug:string)=>YOGA_PRACTICES.find(item=>item.slug===slug);
