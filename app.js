(function(){
"use strict";

if(typeof pdfjsLib!=="undefined"){
  pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

/* ===== Número por extenso ===== */
var _U=["zero","um","dois","três","quatro","cinco","seis","sete","oito","nove","dez","onze","doze","treze","quatorze","quinze","dezesseis","dezessete","dezoito","dezenove"];
var _D=["","","vinte","trinta","quarenta","cinquenta","sessenta","setenta","oitenta","noventa"];
var _C=["","cento","duzentos","trezentos","quatrocentos","quinhentos","seiscentos","setecentos","oitocentos","novecentos"];
function _n999(n){if(n===100)return "cem";var c=Math.floor(n/100),r=n%100,o=[];if(c)o.push(_C[c]);if(r){if(r<20)o.push(_U[r]);else{var d=Math.floor(r/10),u=r%10;o.push(u?_D[d]+" e "+_U[u]:_D[d]);}}return o.join(" e ");}
function _int(n){if(n===0)return "zero";var b=Math.floor(n/1e9),m=Math.floor((n%1e9)/1e6),k=Math.floor((n%1e6)/1e3),r=n%1000,p=[];if(b)p.push(_n999(b)+(b===1?" bilhão":" bilhões"));if(m)p.push(_n999(m)+(m===1?" milhão":" milhões"));if(k)p.push(k===1?"mil":_n999(k)+" mil");if(r)p.push(_n999(r));if(p.length===1)return p[0];var last=p.pop(),prev=p.pop();var j=(r>0&&r<100)||(r===0&&k===0)?" e ":" ";return p.concat([prev+j+last]).join(", ");}
function numeroParaExtenso(num){if(!isFinite(num))return "";var reais=Math.floor(num),cents=Math.round((num-reais)*100),p=[];if(reais>0)p.push(_int(reais)+(reais===1?" real":" reais"));if(cents>0)p.push(_int(cents)+(cents===1?" centavo":" centavos"));return p.length?p.join(" e "):"zero real";}

/* ===== Constantes ===== */
var FIXED={name:"JAROD M M JR",email:"CONTATO@JAROD.COM.BR",phone:"31999635303",cnpj:"67.897.810/0001-63"};
var PIX_FIXED="pix@jarod.com.br";
var CIDADE_FALLBACK="Belo Horizonte/MG";
var DEF_PARC=6,MAX_PARC=12;
var FIELD_IDS=["nome","cpf","rg","email","telefone","placa","renavam","chassi","anoFab","anoModelo","seguro","valor","parcelas","cidade"];
var CLIENT_FIELDS=["nome","cpf","rg","email","telefone"];
var VEH_FIELDS=["placa","renavam","chassi","anoFab","anoModelo"];

/* ===== Estado ===== */
var state={vencimentos:{},crlvFile:null,codigo:""};

/* ===== Helpers ===== */
function $(id){return document.getElementById(id);}
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m];});}
function val(id,fb){var el=$(id);if(!el||!el.value)return fb||"";return el.value.trim()||fb||"";}
function parseMoney(s){if(!s)return NaN;var c=String(s).replace(/[^\d,.-]/g,"").replace(/\.(?=\d{3}(\D|$))/g,"").replace(",",".");var n=parseFloat(c);return isFinite(n)?n:NaN;}
function formatBRL(n){return isFinite(n)?n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}):"";}
function isoToBR(iso){if(!iso)return "";var p=iso.split("-");return p[2]+"/"+p[1]+"/"+p[0];}
function addDaysISO(d){var x=new Date();x.setHours(12,0,0,0);x.setDate(x.getDate()+d);var y=x.getFullYear(),m=("0"+(x.getMonth()+1)).slice(-2),dd=("0"+x.getDate()).slice(-2);return y+"-"+m+"-"+dd;}
function toast(t){var x=$("toast");if(!x)return;x.textContent=t;x.style.display="block";setTimeout(function(){x.style.display="none";},2200);}

/* Remove acentos e caracteres não suportados pelo Helvetica do jsPDF */
function ascii(s){
  return String(s||"")
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[–—]/g,"-")
    .replace(/[“”]/g,'"')
    .replace(/[‘’]/g,"'")
    .replace(/[^\x20-\x7E]/g,"");
}

/* ===== Código único do contrato ===== */
function gerarCodigo(){
  var chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem I, O, 0, 1 (evita confusão)
  var s="";
  for(var i=0;i<8;i++){
    s+=chars.charAt(Math.floor(Math.random()*chars.length));
    if(i===3)s+="-"; // formato XXXX-XXXX
  }
  return s;
}
function setCodigo(novo){
  state.codigo=novo||gerarCodigo();
  var el=$("codigoContrato");
  if(el)el.textContent=state.codigo;
  return state.codigo;
}

/* ===== Cálculos ===== */
function getParcelasCount(){var r=parseInt(val("parcelas",String(DEF_PARC)),10);if(!isFinite(r))return DEF_PARC;return Math.max(1,Math.min(MAX_PARC,r));}
function getVencimento(i){var iso=state.vencimentos[i];return iso?isoToBR(iso):"#VENCIMENTO#";}
function getValorParcela(){var t=parseMoney(val("valor"));if(!isFinite(t)||t<=0)return "#VALOR_PARCELA#";return formatBRL(t/getParcelasCount());}
function getMoney(){var r=val("valor");if(!r)return "R$ #VALOR#";var n=parseMoney(r);return isFinite(n)?formatBRL(n):"R$ "+esc(r);}
function getExtenso(){var v=parseMoney(val("valor"));return(!isFinite(v)||v<=0)?"#VALOR_EXTENSO#":numeroParaExtenso(v);}
function atualizarExtenso(){var v=parseMoney(val("valor"));$("valorExtenso").value=(isFinite(v)&&v>0)?numeroParaExtenso(v):"";}
function getCidade(){var c=val("cidade");return c&&c.charAt(0)!=="#" ? c : CIDADE_FALLBACK;}

/* ===== Templates ===== */
function renderParcelasRows(n){
  var vp=getValorParcela(),rows="";
  for(var i=1;i<=n;i++){rows+="<tr><td>"+i+"ª</td><td>"+esc(vp)+"</td><td>"+esc(getVencimento(i))+"</td></tr>";}
  return rows;
}
function veiculoTable(){
  return '<table class="vehtable">'
    +'<tr><td>Placa</td><td>'+esc(val("placa","#PLACA#"))+'</td></tr>'
    +'<tr><td>Renavam</td><td>'+esc(val("renavam","#RENAVAM#"))+'</td></tr>'
    +'<tr><td>Chassi</td><td>'+esc(val("chassi","#CHASSI#"))+'</td></tr>'
    +'<tr><td>Ano Fabricação / Modelo</td><td>'+esc(val("anoFab","#ANO_FAB#"))+' / '+esc(val("anoModelo","#ANO_MODELO#"))+'</td></tr>'
    +'</table>';
}

/* ===== Render da pré-visualização ===== */
function render(){
  if(!state.codigo)setCodigo();

  var nome=val("nome","#NOME#"),cpf=val("cpf","#CPF#"),rg=val("rg","#RG#"),email=val("email","#EMAIL#"),tel=val("telefone","#TELEFONE#"),seguro=val("seguro","#SEGURO#"),n=getParcelasCount(),cidade=getCidade();

  var h='<div class="paperhead">'
    +'<div class="paperbrand"><b>'+FIXED.name+'</b><div>CNPJ '+FIXED.cnpj+'</div></div>'
    +'<div class="papercodigo">Código do contrato<br><span class="codigo-doc">'+esc(state.codigo)+'</span></div>'
  +'</div>'
  +'<h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE INTERMEDIAÇÃO SECURITÁRIA</h1>'
  +'<div class="lead">Instrumento particular de adesão e ativação de seguro, com intermediação da CONTRATADA</div>'
  +'<div class="parties">'
  +'<div class="party"><div class="partyhead">CONTRATANTE</div><p><b>Nome:</b> '+esc(nome)+'</p><p><b>CPF:</b> '+esc(cpf)+'</p><p><b>RG:</b> '+esc(rg)+'</p><p><b>E-mail:</b> '+esc(email)+'</p><p><b>Telefone:</b> '+esc(tel)+'</p></div>'
  +'<div class="party"><div class="partyhead">CONTRATADA</div><p><b>Razão social:</b> '+FIXED.name+'</p><p><b>CNPJ:</b> '+FIXED.cnpj+'</p><p><b>E-mail:</b> '+FIXED.email+'</p><p><b>Telefone:</b> '+FIXED.phone+'</p></div></div>'
  +'<p>As partes acima qualificadas têm, entre si, justo e contratado o presente instrumento, que se regerá pelas cláusulas e condições a seguir, às quais declaram ter lido, compreendido e aceito integralmente.</p>'
  +'<h2>CLÁUSULA 1ª — DO OBJETO</h2>'
  +'<p>1.1. O presente contrato tem por objeto formalizar a contratação dos serviços de intermediação e assessoria prestados pela CONTRATADA, relacionados ao produto securitário <b>'+esc(seguro)+'</b>, bem como o pagamento da respectiva taxa de adesão e ativação.</p>'
  +'<p>1.2. A CONTRATADA atua como intermediária entre o CONTRATANTE e a seguradora. A CONTRATADA não é seguradora, não assume risco securitário, não garante cobertura, não regula sinistro e não responde por indenizações previstas na apólice.</p>'
  +'<p>1.3. O produto está vinculado ao veículo a seguir identificado:</p>'
  +veiculoTable()
  +'<p>1.4. Este instrumento não substitui a proposta, a apólice, o certificado, o endosso nem as condições gerais do seguro, que permanecem prevalentes para todos os efeitos de cobertura.</p>'
  +'<h2>CLÁUSULA 2ª — DO VALOR E DA FORMA DE PAGAMENTO</h2>'
  +'<p>2.1. Pela intermediação e adesão, o CONTRATANTE pagará à CONTRATADA o valor total de <b>'+esc(getMoney())+'</b> ('+esc(getExtenso())+').</p>'
  +'<p>2.2. O pagamento será realizado em <b>'+n+' parcelas</b>, exclusivamente por Pix, conforme cronograma abaixo.</p>'
  +'<table class="paytable"><thead><tr><th>Parcela</th><th>Valor</th><th>Vencimento</th></tr></thead><tbody>'+renderParcelasRows(n)+'</tbody></table>'
  +'<table class="pix"><tr><td>CHAVE PIX</td><td>'+esc(PIX_FIXED)+'</td></tr><tr><td>Titular</td><td>'+FIXED.name+'</td></tr><tr><td>CNPJ</td><td>'+FIXED.cnpj+'</td></tr></table>'
  +'<p>2.3. O pagamento é considerado efetuado somente após a confirmação do crédito na conta da CONTRATADA. Os comprovantes deverão ser guardados pelo prazo mínimo de cinco anos.</p>'
  +'<p>2.4. O valor remunera exclusivamente a intermediação e a taxa de adesão, não correspondendo a prêmio de seguro.</p>'
  +'<h2>CLÁUSULA 3ª — DO ATRASO E DO INADIMPLEMENTO</h2>'
  +'<p>3.1. O atraso acarretará multa moratória de 2% sobre o valor em atraso, acrescida de juros de mora de 1% ao mês, calculados pro rata die, sem prejuízo da correção monetária pelo IPCA.</p>'
  +'<p>3.2. O atraso superior a 30 dias autoriza a suspensão dos serviços e o encaminhamento do débito para cobrança.</p>'
  +'<h2>CLÁUSULA 4ª — DAS OBRIGAÇÕES DA CONTRATADA</h2>'
  +'<p>4.1. A CONTRATADA se obriga a intermediar a contratação, prestar informações sobre o produto, encaminhar os documentos emitidos pela seguradora e manter sigilo sobre os dados pessoais, tratando-os conforme a Lei nº 13.709/2018.</p>'
  +'<p>4.2. A CONTRATADA não se responsabiliza por recusa de cobertura, por sinistros não cobertos, por informações incorretas prestadas pelo CONTRATANTE nem por fatos alheios à sua esfera de controle.</p>'
  +'<h2>CLÁUSULA 5ª — DAS OBRIGAÇÕES DO CONTRATANTE</h2>'
  +'<p>5.1. O CONTRATANTE se obriga a fornecer informações verdadeiras, manter os dados atualizados, pagar pontualmente as parcelas e observar as condições gerais da apólice.</p>'
  +'<p>5.2. Informação falsa ou inexata pode acarretar recusa de cobertura pela seguradora, sem responsabilidade da CONTRATADA.</p>'
  +'<h2>CLÁUSULA 6ª — DA RESCISÃO</h2>'
  +'<p>6.1. O contrato pode ser rescindido por acordo entre as partes, por inadimplemento após notificação prévia de 5 dias, ou por exercício do direito de arrependimento previsto no art. 49 do CDC, quando aplicável, no prazo legal.</p>'
  +'<p>6.2. A rescisão não afasta a obrigação de pagamento das parcelas vencidas até a data da efetiva rescisão nem das penalidades devidas.</p>'
  +'<h2>CLÁUSULA 7ª — DA PROTEÇÃO DE DADOS (LGPD)</h2>'
  +'<p>7.1. Os dados pessoais serão tratados para as finalidades estritamente relacionadas à execução deste contrato, nos termos da Lei nº 13.709/2018, sendo vedada a utilização para finalidades diversas sem consentimento específico.</p>'
  +'<p>7.2. O CONTRATANTE pode exercer os direitos do art. 18 da LGPD pelos canais indicados neste contrato.</p>'
  +'<h2>CLÁUSULA 8ª — DAS COMUNICAÇÕES</h2>'
  +'<p>8.1. As partes elegem os canais abaixo para todas as comunicações decorrentes deste contrato.</p>'
  +'<div class="comms"><div><strong>CONTRATANTE</strong>Telefone/WhatsApp: '+esc(tel)+'<br>E-mail: '+esc(email)+'</div><div><strong>CONTRATADA</strong>Telefone/WhatsApp: '+FIXED.phone+'<br>E-mail: '+FIXED.email
