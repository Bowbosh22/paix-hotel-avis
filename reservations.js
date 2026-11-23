(function(){
'use strict';
var $=function(i){return document.getElementById(i)};
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var STAT=['Nouvelle','Confirmée','Refusée','Annulée'];
var CH={'standard':'Standard','familiale':'Familiale','suite':'Suite','suite-nuptiale':'Suite nuptiale'};
var MOIS=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
var tab='Nouvelle',known={};
function two(n){return n<10?'0'+n:''+n}
function when(iso){var d=new Date(iso),t=new Date(),y=new Date(t.getTime()-864e5),h=two(d.getHours())+':'+two(d.getMinutes());
  if(d.toDateString()===t.toDateString())return "Aujourd'hui "+h;if(d.toDateString()===y.toDateString())return 'Hier '+h;return d.getDate()+' '+MOIS[d.getMonth()]+' '+h}
function dfr(v,lang){var d=new Date(v+'T00:00:00');return d.toLocaleDateString(lang==='en'?'en-GB':'fr-FR',{weekday:'short',day:'numeric',month:'long',year:'numeric'})}
function nights(r){return Math.round((new Date(r.depart)-new Date(r.arrivee))/864e5)}
function fmt(n){return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function st(r){return r.statut||'Nouvelle'}
/* numéro WhatsApp : chiffres seuls ; un numéro local à 9 chiffres commençant par 0 reçoit l'indicatif du Congo (242) — à confirmer */
function waNum(tel){var raw=String(tel||'').trim(),d=raw.replace(/\D/g,'');if(d.indexOf('00')===0&&raw.charAt(0)!=='+')d=d.slice(2),raw='+'+d;if(raw.charAt(0)==='+'){var cc=['212','213','216','221','225','237','241','243','33','32','34','39','41','44','49'];for(var i=0;i<cc.length;i++){if(d.indexOf(cc[i]+'0')===0){d=cc[i]+d.slice(cc[i].length+1);break}}return d}if(d.length===9&&d.charAt(0)==='0')return '242'+d;return d}
function msg(r,kind){
  var n=nights(r),ch=CH[r.chambre]||r.chambre,en=r.lang==='en',a=dfr(r.arrivee,r.lang),d=dfr(r.depart,r.lang),tot=r.total?fmt(r.total)+' FCFA':'';
  if(kind==='Confirmée'){
    return en?['Hello '+r.nom+',','','Hôtel de la Paix confirms your reservation '+r.id+':','- Room: '+ch,'- Arrival: '+a,'- Departure: '+d+' ('+n+(n>1?' nights':' night')+')','- Guests: '+r.personnes,(tot?'- Indicative rate: '+tot:''),'','We look forward to welcoming you.','Hôtel de la Paix, Brazzaville'].filter(function(x,i,l){return x!==''||l[i-1]!==''}).join('\n')
    :['Bonjour '+r.nom+',','','L\'Hôtel de la Paix vous confirme votre réservation '+r.id+' :','- Chambre : '+ch,'- Arrivée : '+a,'- Départ : '+d+' ('+n+(n>1?' nuits':' nuit')+')','- Personnes : '+r.personnes,(tot?'- Tarif indicatif : '+tot:''),'','Au plaisir de vous accueillir.','Hôtel de la Paix, Brazzaville'].join('\n').replace(/\n\n\n/g,'\n\n');
  }
  if(kind==='Refusée'){
    return en?'Hello '+r.nom+',\n\nThank you for your request '+r.id+'. Unfortunately we have no '+ch+' room available from '+a+' to '+d+'. Would other dates or another room category suit you?\n\nHôtel de la Paix, Brazzaville'
    :'Bonjour '+r.nom+',\n\nMerci pour votre demande '+r.id+'. Nous sommes désolés : nous n\'avons pas de chambre '+ch+' disponible du '+a+' au '+d+'. D\'autres dates ou une autre catégorie de chambre vous conviendraient-elles ?\n\nHôtel de la Paix, Brazzaville';
  }
  return en?'Hello '+r.nom+',\n\nYour reservation '+r.id+' has been cancelled.\n\nHôtel de la Paix, Brazzaville':'Bonjour '+r.nom+',\n\nVotre réservation '+r.id+' est annulée.\n\nHôtel de la Paix, Brazzaville';
}
function notify(r){
  var k=st(r);if(k==='Nouvelle')return '';
  var t=msg(r,k),en=r.lang==='en',subj=(k==='Confirmée'?(en?'Reservation confirmed ':'Réservation confirmée '):k==='Refusée'?(en?'Your request ':'Votre demande '):(en?'Reservation cancelled ':'Réservation annulée '))+r.id;
  var wa=waNum(r.tel)?'<a class="act'+(r.canal==='whatsapp'?' pri':'')+'" href="https://wa.me/'+waNum(r.tel)+'?text='+encodeURIComponent(t)+'" target="_blank" rel="noopener">Prévenir par WhatsApp</a>':'';
  var ml=r.email?'<a class="act'+(r.canal==='email'?' pri':'')+'" href="https://mail.google.com/mail/?view=cm&fs=1&to='+encodeURIComponent(r.email)+'&su='+encodeURIComponent(subj)+'&body='+encodeURIComponent(t)+'" target="_blank" rel="noopener">Prévenir par e-mail (Gmail)</a><a class="act" href="mailto:'+esc(r.email)+'?subject='+encodeURIComponent(subj)+'&body='+encodeURIComponent(t)+'">Autre messagerie</a>':'';
  var cp='<button type="button" class="act copyb" data-t="'+encodeURIComponent(t)+'">Copier le message</button>';
  var pref=r.canal==='email'?'e-mail':'WhatsApp';
  return '<div class="notif"><p class="who">Le client souhaite être prévenu par <b>'+pref+'</b>. Le message est déjà rédigé, vous pouvez le modifier avant l\'envoi.</p><div class="acts2">'+(r.canal==='email'?ml+wa:wa+ml)+cp+'</div></div>';
}
function card(r){
  var n=nights(r),ch=CH[r.chambre]||r.chambre,s=st(r);
  var h='<div class="rv rs'+(s==='Nouvelle'?' alert':'')+'" data-id="'+esc(r.id)+'"><div class="hd"><b>'+esc(r.id)+' · '+esc(r.nom)+'</b><span>'+when(r.date)+'</span></div>'+
   '<p class="rline"><b>'+esc(ch)+'</b> · '+dfr(r.arrivee)+' → '+dfr(r.depart)+' · '+n+(n>1?' nuits':' nuit')+' · '+r.personnes+(r.personnes>1?' personnes':' personne')+'</p>'+
   (r.total?'<p class="who">Total estimé : '+fmt(r.total)+' FCFA</p>':'')+
   '<div class="who">'+esc(r.tel)+(r.email?' · '+esc(r.email):'')+' · confirmation par '+(r.canal==='email'?'e-mail':'WhatsApp')+'</div>'+
   (r.message?'<p class="rmsg">« '+esc(r.message)+' »</p>':'')+
   '<div class="chips">'+STAT.map(function(x){return '<button type="button" class="s-'+x.slice(0,2)+(x===s?' on':'')+'" data-s="'+x+'">'+x+'</button>'}).join('')+'</div>'+
   '<textarea class="note" placeholder="Note interne (n° de chambre, remarque…)" maxlength="500">'+esc(r.noteInterne||'')+'</textarea>'+
   '<div class="noterow"><button type="button" class="notesave" disabled>Valider</button><span class="notemsg" role="status"></span></div>';
  var hi=r.historique&&r.historique.length?r.historique[r.historique.length-1]:null;
  if(hi)h+='<div class="hist">'+esc(hi.s)+' · '+when(hi.date)+'</div>';
  return h+notify(r)+'</div>';
}
function render(){
  var L=Resa.all().sort(function(a,b){return a.date<b.date?-1:1}),cn={};
  STAT.forEach(function(x){cn[x]=0});L.forEach(function(r){cn[st(r)]=(cn[st(r)]||0)+1});
  $('tabs').innerHTML=STAT.map(function(x){return '<button type="button" data-t="'+x+'" aria-pressed="'+(x===tab)+'"><b>'+cn[x]+'</b>'+x+'</button>'}).join('');
  var q=($('q').value||'').trim().toLowerCase().replace(/\s+/g,' '),qd=q.replace(/\D/g,''),sel;
  if(q){sel=L.filter(function(r){return (r.id+' '+r.nom+' '+(r.email||'')).toLowerCase().indexOf(q)>-1||(qd.length>=3&&String(r.tel||'').replace(/\D/g,'').indexOf(qd)>-1)}).reverse();
    $('qinfo').hidden=false;$('qinfo').textContent=sel.length?sel.length+(sel.length>1?' résultats':' résultat')+' pour « '+$('q').value.trim()+' », toutes demandes confondues.':'Aucune demande trouvée pour « '+$('q').value.trim()+' ».'}
  else{$('qinfo').hidden=true;sel=L.filter(function(r){return st(r)===tab});if(tab!=='Nouvelle')sel.reverse()}
  $('list').innerHTML=sel.map(card).join('');$('none').hidden=sel.length>0;
  L.forEach(function(r){known[r.id]=1});
}
var tt;function toast(m){var t=$('toast');t.textContent=m;t.hidden=false;clearTimeout(tt);tt=setTimeout(function(){t.hidden=true},5000)}
function dirty(c){var b=c.querySelector('.notesave'),m=c.querySelector('.notemsg');b.disabled=false;m.className='notemsg dirty';m.textContent='Modifications non validées'}
$('list').addEventListener('click',function(e){var b=e.target.closest('.copyb');if(!b)return;var s=decodeURIComponent(b.dataset.t);
  function fb(){var a=document.createElement('textarea');a.value=s;a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();try{document.execCommand('copy');toast('✓ Message copié : collez-le dans WhatsApp, un e-mail ou un SMS')}catch(x){toast('Copie impossible : sélectionnez le texte à la main')}document.body.removeChild(a)}
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(s).then(function(){toast('✓ Message copié : collez-le dans WhatsApp, un e-mail ou un SMS')},fb);else fb()});
$('q').addEventListener('input',render);
$('tabs').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;tab=b.dataset.t;render()});
$('list').addEventListener('click',function(e){
  var c=e.target.closest('.rs');if(!c)return;
  var chip=e.target.closest('.chips button');
  if(chip){c.querySelectorAll('.chips button').forEach(function(x){x.classList.remove('sel')});chip.classList.add('sel');dirty(c);return}
  var b=e.target.closest('button.notesave');if(!b)return;
  var sel=c.querySelector('.chips button.sel'),ns=sel?sel.dataset.s:null,txt=c.querySelector('textarea.note').value.trim(),m=c.querySelector('.notemsg');
  b.disabled=true;m.className='notemsg';m.textContent='Enregistrement…';
  Promise.resolve(Resa.update(c.dataset.id,function(r){if(ns&&ns!==st(r)){r.statut=ns;(r.historique=r.historique||[]).push({s:ns,date:new Date().toISOString()})}r.noteInterne=txt})).then(function(ok){
    if(ok){toast('✓ Validé'+(ns?' : '+ns:''));if(ns)tab=ns;render();window.scrollTo({top:0,behavior:'smooth'})}
    else{b.disabled=false;m.className='notemsg err';m.textContent='✕ Échec, réessayez'}});
});
$('list').addEventListener('input',function(e){var t=e.target.closest('textarea.note');if(t)dirty(t.closest('.rs'))});
Resa.ready().then(function(){
  var q=location.hash.replace('#','');if(STAT.indexOf(q)>-1)tab=q;
  render();
  Resa.watch(function(){
    var fresh=Resa.all().filter(function(r){return !known[r.id]&&st(r)==='Nouvelle'});
    render();if(fresh.length)toast('Nouvelle demande de réservation : '+fresh[fresh.length-1].nom);
  });
});
})();
