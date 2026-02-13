// Protótipo WhatsApp — lógica de renderização
(function(){
  const chatBody = document.getElementById('chat');
  const btnRenova = document.getElementById('btn-renovacao');
  const btnEncam = document.getElementById('btn-encaminhamento');
  const medInput = document.getElementById('medInput');
  const pdfInput = document.getElementById('pdfInput');
  const btnEnviar = document.getElementById('btnEnviarDados');
  let currentSection = null;
  let awaitingMedication = false;

  const flows = {
    renovacao: [
      { sender: 'bot', text: 'Olá! Vamos iniciar o processo de renovação da sua receita. Para continuar, preciso de algumas informações suas:' },
      { sender: 'bot', text: '1. Informe seu nome completo:\n\n2. Data de nascimento (DD/MM/AAAA)\n\n3. Informe seu CPF:' },
      { sender: 'user', text: 'João da Silva\n01/01/1970\n12345678900' },
      { sender: 'bot', text: 'Receita renovada com sucesso!' },
      { sender: 'bot', type: 'card', cardType: 'receita', data: {
          paciente: 'João da Silva',
          cpf: '***.456.***-**',
          medicamento: 'Losartana 50 mg',
          posologia: 'Tomar 1 comprimido por dia — por 90 dias',
          url: 'https://receita.saude.gov.br'
        }
      },
      { sender: 'bot', text: 'Se precisar de algo mais, estou à disposição!' }
    ],
    encaminhamento: [
      { sender: 'bot', text: 'Não foi possível realizar a renovação automática da sua receita.' },
      { sender: 'bot', text: 'Você será encaminhado para um teleatendimento médico.' },
      { sender: 'bot', text: 'Aguarde um contato para marcar sua consulta virtual com um médico do SUS. Em breve entraremos em contato para agendar um horário.' },
      { sender: 'bot', text: 'Se precisar de algo mais, estou à disposição!' }
    ]
  };

  function clearChat(){ chatBody.innerHTML = ''; }
  function addSection(){ const s = document.createElement('div'); s.className='chat-section'; chatBody.appendChild(s); currentSection = s; return s; }

  function renderMessage(section, msg){
    if(msg.type === 'card' && msg.cardType === 'receita'){
      const card = document.createElement('div');
      card.className = 'card';
      card.setAttribute('role','group');
      card.innerHTML = `
        <div class="card-header">
          <div class="badge" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2l3 6 6 .5-4.5 4 1.5 6-6-3.5-6 3.5 1.5-6L3 8.5 9 8z" fill="#0ea5e9"/></svg>
          </div>
          Receita Digital
        </div>
        <div class="card-body">
          <div class="meta">
            <div class="title">Paciente: ${msg.data.paciente}</div>
            <div>CPF: ${msg.data.cpf}</div>
            <div>${msg.data.medicamento}</div>
            <div>${msg.data.posologia}</div>
            <div class="timestamp">Validade: 90 dias</div>
            <div class="cta"><a href="${msg.data.url}" target="_blank" rel="noopener">Validar receita</a></div>
          </div>
          <div class="qr" aria-label="QR Code">
            ${generateQRCodeSVG(120, 120)}
          </div>
        </div>
      `;
      section.appendChild(card);
      return;
    }
    const el = document.createElement('div');
    el.className = `msg ${msg.sender}`;
    el.innerHTML = msg.text.replace(/\n/g,'<br/>');
    section.appendChild(el);
  }

  function generateQRCodeSVG(w,h){
    // Gera um QR code estilizado simples (placeholder) usando padrão de blocos
    const size = 6; // tamanho dos blocos
    const cols = Math.floor(w/size), rows = Math.floor(h/size);
    let blocks = '';
    for(let y=0;y<rows;y++){
      for(let x=0;x<cols;x++){
        const on = Math.random() > 0.52 || (x<8 && y<8) || (x>cols-10 && y<8) || (x<8 && y>rows-10);
        if(on){ blocks += `<rect x="${x*size}" y="${y*size}" width="${size}" height="${size}" fill="#0b0e14"/>`; }
      }
    }
    // molduras localizadoras
    const finder = (fx,fy) => `
      <rect x="${fx}" y="${fy}" width="42" height="42" fill="#0b0e14"/>
      <rect x="${fx+4}" y="${fy+4}" width="34" height="34" fill="#fff"/>
      <rect x="${fx+10}" y="${fy+10}" width="22" height="22" fill="#0b0e14"/>
    `;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <rect width="${w}" height="${h}" fill="#fff"/>
      ${blocks}
      ${finder(4,4)}
      ${finder(w-46,4)}
      ${finder(4,h-46)}
    </svg>`;
  }

  function renderFlow(flow){
    clearChat();
    const section = addSection();
    let i = 0;
    function next(){
      if(i>=flow.length){ chatBody.scrollTop = chatBody.scrollHeight; return; }
      renderMessage(section, flow[i]); i++;
      chatBody.scrollTop = chatBody.scrollHeight;
      setTimeout(next, 500);
    }
    next();
  }

  function setActive(btn){
    [btnRenova, btnEncam].forEach(b=>{
      const active = b===btn; b.classList.toggle('active', active); b.setAttribute('aria-selected', active?'true':'false');
    });
  }

  function startRenovacaoFlow(){
    clearChat();
    const section = addSection();
    awaitingMedication = true;
    medInput.value=''; pdfInput.value='';
    pdfInput.required = true;
    const intro = [
      { sender: 'bot', text: 'Olá! Vamos iniciar o processo de renovação da sua receita.' },
      { sender: 'bot', text: 'Informe abaixo o nome do medicamento que deseja renovar e anexe a receita antiga em PDF usando o clipe (obrigatório).' }
    ];
    let i=0; function next(){ if(i>=intro.length){ chatBody.scrollTop=chatBody.scrollHeight; return; } renderMessage(section,intro[i++]); chatBody.scrollTop=chatBody.scrollHeight; setTimeout(next,500); } next();
  }
  function startEncaminhamentoFlow(){ awaitingMedication=false; renderFlow(flows.encaminhamento); }

  btnRenova.addEventListener('click', ()=>{ setActive(btnRenova); startRenovacaoFlow(); });
  btnEncam.addEventListener('click', ()=>{ setActive(btnEncam); startEncaminhamentoFlow(); });
  const attachBtn = document.querySelector('.attach-btn');
  attachBtn.addEventListener('click', ()=> pdfInput && pdfInput.click());
  btnEnviar.addEventListener('click', ()=>{
    if(!awaitingMedication) return;
    const med = medInput.value.trim();
    const file = pdfInput.files[0];
    if(!med){ renderMessage(currentSection, {sender:'bot', text:'Por favor, informe o medicamento para continuar.'}); medInput.focus(); return; }
    if(!file){
      renderMessage(currentSection, {sender:'bot', text:'Por favor, anexe a receita antiga em PDF para continuar.'});
      pdfInput.focus();
      const attachBtn = document.querySelector('.attach-btn');
      attachBtn && attachBtn.click();
      return;
    }
    if(file.type !== 'application/pdf'){
      renderMessage(currentSection, {sender:'bot', text:'O arquivo anexado precisa ser um PDF. Selecione a receita antiga em PDF/IMAGEM.'});
      pdfInput.value='';
      const attachBtn = document.querySelector('.attach-btn');
      attachBtn && attachBtn.click();
      return;
    }
    renderMessage(currentSection, {sender:'user', text: med});
    const url = URL.createObjectURL(file);
    renderMessage(currentSection, {sender:'user', text: `Anexei a receita antiga: <a href="${url}" target="_blank" rel="noopener">Ver PDF</a>`});
    awaitingMedication=false;
    setTimeout(()=>renderMessage(currentSection,{sender:'bot', text:`Obrigado! Vou verificar a possibilidade de renovar a receita para ${med}.`}), 600);
    setTimeout(()=>renderMessage(currentSection,{sender:'bot', text:'Receita renovada com sucesso!'}), 1100);
    setTimeout(()=>renderMessage(currentSection,{sender:'bot', type:'card', cardType:'receita', data:{paciente:'João da Silva', cpf:'***.456.***-**', medicamento:med, posologia:'Tomar 1 comprimido por dia — por 90 dias', url:'https://receita.saude.gov.br'}}), 1600);
    setTimeout(()=>renderMessage(currentSection,{sender:'bot', text:'Se precisar de algo mais, estou à disposição!'}), 2000);
    medInput.value=''; pdfInput.value='';
  });
  // inicializa padrão
  setActive(btnRenova);
  startRenovacaoFlow();
})();
