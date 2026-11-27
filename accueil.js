(function(){
'use strict';
var $=function(i){return document.getElementById(i)};
$('out2').addEventListener('click',function(){Auth.out();location.href='admin.html'});
function badge(el,n,txt){el.textContent=txt;el.className='hs'+(n?' alert':'')}
Promise.all([Store.ready(),Resa.ready()]).then(function(){
  var A=Store.all(),R=Resa.all();
  var recl=A.filter(function(a){return a.note<=2&&(a.statut||'Nouveau')==='Nouveau'}).length;
  var nr=R.filter(function(r){return (r.statut||'Nouvelle')==='Nouvelle'}).length;
  badge($('sAvis'),recl,recl?('⚠ '+recl+(recl>1?' réclamations à traiter':' réclamation à traiter')):(A.length?A.length+(A.length>1?' avis reçus':' avis reçu'):'Aucun avis pour le moment'));
  badge($('sResa'),nr,nr?('🛎 '+nr+(nr>1?' nouvelles demandes':' nouvelle demande')):'Aucune nouvelle demande');
},function(){});
var C=window.PAIX_CFG||{};
if(C.SUPABASE_URL)Auth.token().then(function(t){return fetch(C.SUPABASE_URL+'/rest/v1/abonnes?select=id',{headers:{apikey:C.SUPABASE_ANON_KEY,Authorization:'Bearer '+t,Prefer:'count=exact',Range:'0-0'}})})
 .then(function(r){var m=(r.headers.get('content-range')||'').match(/\/(\d+)$/);if(!r.ok||!m)throw 0;var n=+m[1];badge($('sNews'),0,n?(n+(n>1?' abonnés':' abonné')):'Aucun abonné pour le moment')}).then(null,function(){badge($('sNews'),0,'Voir la liste')});
else badge($('sNews'),0,'Voir la liste');
})();
