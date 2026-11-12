export function mailReady(env){return typeof env.XAR_EMAIL_TRANSPORT==='function'||['resend','brevo'].includes(env.XAR_EMAIL_PROVIDER)&&typeof env.XAR_EMAIL_API_KEY==='string'&&env.XAR_EMAIL_API_KEY.length>10&&typeof env.XAR_EMAIL_FROM==='string'&&/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(env.XAR_EMAIL_FROM)}
export async function sendResetEmail(env,email,link){
 const message={to:email,subject:'XaR Cloud — восстановление пароля',text:'Для установки нового пароля открой ссылку:\n'+link+'\n\nСсылка действует 15 минут и используется один раз. Если ты не запрашивал сброс, ничего делать не нужно.'};
 if(typeof env.XAR_EMAIL_TRANSPORT==='function'){await env.XAR_EMAIL_TRANSPORT(message);return}
 if(!mailReady(env))throw Error('Отправка писем пока не подключена.');
 const resend=env.XAR_EMAIL_PROVIDER==='resend',url=resend?'https://api.resend.com/emails':'https://api.brevo.com/v3/smtp/email',headers={'Content-Type':'application/json'},payload=resend?{from:'XaR Cloud <'+env.XAR_EMAIL_FROM+'>',to:[email],subject:message.subject,text:message.text}:{sender:{name:'XaR Cloud',email:env.XAR_EMAIL_FROM},to:[{email}],subject:message.subject,textContent:message.text};
 headers[resend?'Authorization':'api-key']=resend?'Bearer '+env.XAR_EMAIL_API_KEY:env.XAR_EMAIL_API_KEY;
 const response=await fetch(url,{method:'POST',headers,body:JSON.stringify(payload),signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw Error('Не удалось отправить письмо. Попробуй позже.');
}
