/** Pure textarea parser: blank spacer lines, Windows CRLF and trailing newline are not quiz answers. */
export function parseQuizChoices(raw:string):string[]{
 return raw.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
}
export function quizChoiceCountMessage(raw:string,uk:boolean):string{
 const count=parseQuizChoices(raw).length;
 if(count===3)return uk?'3 з 3 варіантів — готово':'3 of 3 choices — ready';
 if(count>3)return (uk?'Знайдено ':'Found ')+count+(uk?' варіантів: залиш 3 непорожні рядки.':' choices: keep exactly 3 non-empty lines.');
 return String(count)+(uk?' з 3 варіантів. Порожні рядки не враховуються.':' of 3 choices. Blank lines are ignored.');
}
