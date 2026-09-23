texto("2.1. Pela intermediacao e adesao, o CONTRATANTE pagara a CONTRATADA o valor total de "+val("valor","")+" ("+getExtenso()+").",9);
  texto("2.2. O pagamento sera realizado em "+n+" parcelas, exclusivamente por Pix, conforme cronograma abaixo.",9);

  /* Tabela de parcelas no PDF */
  quebra(8 + n*6 + 4);
  var yp=y;
  doc.setFillColor(52,58,64);
  doc.rect(M,yp,usable,7,"F");
  doc.setTextColor(255);
  doc.setFont("helvetica","bold");
  doc.setFontSize(8.5);
  doc.text("Parcela",M+usable*0.10,yp+4.8,{align:"center"});
  doc.text("Valor",M+usable*0.45,yp+4.8,{align:"center"});
  doc.text("Vencimento",M+usable*0.78,yp+4.8,{align:"center"});
  doc.setTextColor(0);
  yp+=7;
  var vp=getValorParcela();
  for(var pi=1;pi<=n;pi++){
    doc.setDrawColor(150);
    doc.rect(M,yp,usable,6);
    doc.setFont("helvetica","normal");
    doc.setFontSize(8.5);
    doc.text(String(pi)+"a",M+usable*0.10,yp+4,{align:"center"});
    doc.text(ascii(vp),M+usable*0.45,yp+4,{align:"center"});
    doc.text(getVencimento(pi),M+usable*0.78,yp+4,{align:"center"});
    yp+=6;
  }
  y=yp+4;

  /* Tabela Pix */
  quebra(20);
  var pix=[["CHAVE PIX",PIX_FIXED],["Titular",FIXED.name],["CNPJ",FIXED.cnpj]];
  for(var kp=0;kp<pix.length;kp++){
    doc.setFillColor(235,235,235);
    doc.rect(M,y,55,6,"F");
    doc.setDrawColor(150);
    doc.rect(M,y,55,6);
    doc.rect(M+55,y,usable-55,6);
    doc.setFont("helvetica","bold");
    doc.setFontSize(8.5);
    doc.text(ascii(pix[kp][0]),M+2,y+4);
    doc.setFont("helvetica","normal");
    doc.text(ascii(pix[kp][1]),M+57,y+4);
    y+=6;
  }
  y+=4;

  texto("2.3. O pagamento e considerado efetuado somente apos a confirmacao do credito na conta da CONTRATADA. Os comprovantes deverao ser guardados pelo prazo minimo de cinco anos.",9);
  texto("2.4. O valor remunera exclusivamente a intermediacao e a taxa de adesao, nao correspondendo a premio de seguro.",9);

  titulo("CLAUSULA 3 - DO ATRASO E DO INADIMPLEMENTO");
  texto("3.1. O atraso acarretara multa moratoria de 2% sobre o valor em atraso, acrescida de juros de mora de 1% ao mes, calculados pro rata die, sem prejuizo da correcao monetaria pelo IPCA.",9);
  texto("3.2. O atraso superior a 30 dias autoriza a suspensao dos servicos e o encaminhamento do debito para cobranca.",9);

  titulo("CLAUSULA 4 - DAS OBRIGACOES DA CONTRATADA");
  texto("4.1. A CONTRATADA se obriga a intermediar a contratacao, prestar informacoes sobre o produto, encaminhar os documentos emitidos pela seguradora e manter sigilo sobre os dados pessoais, tratando-os conforme a Lei no 13.709/2018.",9);
  texto("4.2. A CONTRATADA nao se responsabiliza por recusa de cobertura, por sinistros nao cobertos, por informacoes incorretas prestadas pelo CONTRATANTE nem por fatos alheios a sua esfera de controle.",9);

  titulo("CLAUSULA 5 - DAS OBRIGACOES DO CONTRATANTE");
  texto("5.1. O CONTRATANTE se obriga a fornecer informacoes verdadeiras, manter os dados atualizados, pagar pontualmente as parcelas e observar as condicoes gerais da apolice.",9);
  texto("5.2. Informacao falsa ou inexata pode acarretar recusa de cobertura pela seguradora, sem responsabilidade da CONTRATADA.",9);

  titulo("CLAUSULA 6 - DA RESCISAO");
  texto("6.1. O contrato pode ser rescindido por acordo entre as partes, por inadimplemento apos notificacao previa de 5 dias, ou por exercicio do direito de arrependimento previsto no art. 49 do CDC, quando aplicavel, no prazo legal.",9);
  texto("6.2. A rescisao nao afasta a obrigacao de pagamento das parcelas vencidas ate a data da efetiva rescisao nem das penalidades devidas.",9);

  titulo("CLAUSULA 7 - DA PROTECAO DE DADOS (LGPD)");
  texto("7.1. Os dados pessoais serao tratados para as finalidades estritamente relacionadas a execucao deste contrato, nos termos da Lei no 13.709/2018, sendo vedada a utilizacao para finalidades diversas sem consentimento especifico.",9);
  texto("7.2. O CONTRATANTE pode exercer os direitos do art. 18 da LGPD pelos canais indicados neste contrato.",9);

  titulo("CLAUSULA 8 - DAS COMUNICACOES");
  texto("8.1. As partes elegem os canais abaixo para todas as comunicacoes decorrentes deste contrato.",9);
  quebra(14);
  var cy=y;
  doc.setDrawColor(150);
  doc.rect(M,cy,usable/2,14);
  doc.rect(M+usable/2,cy,usable/2,14);
  doc.setFillColor(235,235,235);
  doc.rect(M,cy,usable/2,5,"F");
  doc.rect(M+usable/2,cy,usable/2,5,"F");
  doc.setFont("helvetica","bold");
  doc.setFontSize(8);
  doc.text("CONTRATANTE",M+usable/4,cy+3.5,{align:"center"});
  doc.text("CONTRATADA",M+usable*0.75,cy+3.5,{align:"center"});
  doc.setFont("helvetica","normal");
  doc.text(ascii("Tel: "+tel),M+2,cy+9);
  doc.text(ascii("E-mail: "+email),M+2,cy+12.5);
  doc.text(ascii("Tel: "+FIXED.phone),M+usable/2+2,cy+9);
  doc.text(ascii("E-mail: "+FIXED.email),M+usable/2+2,cy+12.5);
  y=cy+18;

  texto("8.2. Considera-se valida a comunicacao enviada para o e-mail ou WhatsApp informados, presumindo-se o recebimento apos 24 horas do envio.",9);

  titulo("CLAUSULA 9 - DO FORO");
  texto("9.1. Fica eleito o foro do domicilio do CONTRATANTE para dirimir controversias oriundas deste contrato, conforme art. 101, I, do CDC, quando aplicavel a relacao de consumo.",9);

  titulo("CLAUSULA 10 - DAS DISPOSICOES GERAIS");
  texto("10.1. A tolerancia quanto ao descumprimento de obrigacao nao constitui novacao, renuncia ou alteracao do pactuado.",9);
  texto("10.2. A eventual nulidade de qualquer clausula nao prejudica as demais, que permanecem validas e eficazes.",9);
  texto("10.3. Este contrato e firmado em carater irrevogavel e irretratavel, obrigando as partes, seus herdeiros e sucessores.",9);
  texto("E, por estarem de acordo, as partes assinam o presente instrumento, declarando ter lido e compreendido todas as clausulas.",9);
  espaco(4);
  texto(cidade+", ______ de __________________________ de __________.",9);

  /* Assinaturas */
  quebra(30);
  var sy=y+16;
  doc.setDrawColor(50);
  doc.setLineWidth(0.3);
  doc.line(M+5,sy,M+usable/2-5,sy);
  doc.line(M+usable/2+5,sy,W-M-5,sy);
  doc.setFont("helvetica","normal");
  doc.setFontSize(8.5);
  doc.text("CONTRATANTE",M+usable/4,sy+4,{align:"center"});
  doc.text(ascii("Nome: "+nome),M+usable/4,sy+8,{align:"center"});
  doc.text(ascii("CPF: "+cpf),M+usable/4,sy+12,{align:"center"});
  doc.text("CONTRATADA",M+usable*0.75,sy+4,{align:"center"});
  doc.text(ascii("Nome: "+FIXED.name),M+usable*0.75,sy+8,{align:"center"});
  doc.text(ascii("CNPJ: "+FIXED.cnpj),M+usable*0.75,sy+12,{align:"center"});

  rodape();

  var nomeArquivo="contrato-"+((nome||"cliente").replace(/[^\w]+/g,"-").toLowerCase())+".pdf";
  doc.save(nomeArquivo);
}

/* ===== Reset ===== */
function resetForm(){
  for(var i=0;i<FIELD_IDS.length;i++){
    var el=$(FIELD_IDS[i]);
    if(el)el.value="";
  }
  $("parcelas").value=DEF_PARC;
  $("pix").value=PIX_FIXED;
  $("valorExtenso").value="";
  state.vencimentos={};
  state.crlvFile=null;
  var f=$("crlvFile");if(f)f.value="";
  var st=$("crlvStatus");if(st){st.textContent="Nenhum arquivo anexado.";st.className="hint";}
  var btn=$("btnExtrair");if(btn)btn.disabled=true;
  buildParcelasForm();
  atualizarExtenso();
  render();
  toast("Formulario limpo.");
}

/* ===== Preencher exemplo ===== */
function fillDemo(){
  $("nome").value="Maria Aparecida Souza";
  $("cpf").value="123.456.789-00";
  $("rg").value="MG-12.345.678";
  $("email").value="maria.souza@email.com";
  $("telefone").value="(31) 98888-7777";
  $("placa").value="ABC1D23";
  $("renavam").value="12345678901";
  $("chassi").value="9BWZZZ377VT004251";
  $("anoFab").value="2020";
  $("anoModelo").value="2021";
  $("seguro").value="Protecao Veicular Completa";
  $("valor").value="1.200,00";
  $("parcelas").value="6";
  $("cidade").value="Belo Horizonte/MG";
  state.vencimentos={};
  buildParcelasForm();
  atualizarExtenso();
  render();
  toast("Exemplo preenchido.");
}

/* ===== PDF ===== */
function baixarPdf(){
  try{
    gerarPdf();
    toast("PDF gerado.");
  }catch(e){
    console.error(e);
    alert("Erro ao gerar PDF: "+e.message);
  }
}

/* ===== Bootstrap ===== */
function bindEvents(){
  /* Inputs que disparam re-render */
  for(var i=0;i<FIELD_IDS.length;i++){
    var el=$(FIELD_IDS[i]);
    if(!el)continue;
    el.addEventListener("input",function(){
      if(this.id==="valor")atualizarExtenso();
      if(this.id==="parcelas")buildParcelasForm();
      render();
    });
  }
  /* Arquivo CRLV */
  var cf=$("crlvFile");
  if(cf)cf.addEventListener("change",handleCrlv);
}

function init(){
  bindEvents();
  buildParcelasForm();
  atualizarExtenso();
  render();
}

/* ===== API global usada pelo HTML (onclick="App.xxx()") ===== */
window.App={
  resetForm:resetForm,
  fillDemo:fillDemo,
  baixarPdf:baixarPdf,
  extrair:extrair
};

if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",init);
}else{
  init();
}

})();
