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
})();
