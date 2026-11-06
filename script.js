// Configuração fixa do aluno
const CONFIG_ALUNO = {
  turma: "9B",
  numeroChamada: 7,
  apiUrl: "https://boletim-api.profbt.com.br"
};

// Variável para armazenar o PIN em memória durante a sessão
let pinSessao = "";

// Modo de edição desativado por padrão
let modoEdicao = false;

// Instâncias dos gráficos para gerenciamento do Chart.js
let graficoMedias = null;
let graficoEvolucao = null;
let graficoFaltas = null;

// Dados locais padrão do 9º Ano (utilizados caso a API retorne null)
let dadosBoletim = [
  { disciplina: "Língua Portuguesa", tri1: 78, tri2: "8,2", tri3: 8.6, faltas: [2, 2, 1] },
  { disciplina: "Matemática", tri1: 55, tri2: "5,4", tri3: null, faltas: [3, 2, 2] },
  { disciplina: "Ciências", tri1: 84, tri2: 7.9, tri3: "8,3", faltas: [1, 1, 1] },
  { disciplina: "História", tri1: "7,1", tri2: 82, tri3: null, faltas: [1, 2, 1] },
  { disciplina: "Geografia", tri1: 69, tri2: "7,5", tri3: 7.8, faltas: [0, 1, 1] },
  { disciplina: "Língua Inglesa", tri1: 88, tri2: 8.4, tri3: null, faltas: [1, 0, 1] },
  { disciplina: "Arte", tri1: "9,2", tri2: 87, tri3: 9.0, faltas: [1, 1, 0] },
  { disciplina: "Educação Física", tri1: 96, tri2: "9,3", tri3: null, faltas: [0, 1, 0] },
  { disciplina: "Educação Digital", tri1: 91, tri2: 8.9, tri3: "9,4", faltas: [1, 1, 0] },
  { disciplina: "Educação Financeira", tri1: 76, tri2: "7,2", tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Rec. Aprend. Matemática", tri1: 58, tri2: "5,9", tri3: 6.2, faltas: [2, 2, 1] },
  { disciplina: "Leitura Rec. Aprend. Lingua Portuguesa", tri1: 72, tri2: "7,6", tri3: null, faltas: [2, 1, 1] },
  { disciplina: "Pensamento Lógico", tri1: 49, tri2: 5.5, tri3: "5,8", faltas: [2, 2, 2] },
  { disciplina: "Literatura Arte e Movimento", tri1: "8,0", tri2: 84, tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Práticas Experimentais", tri1: 64, tri2: "6,6", tri3: 7.0, faltas: [1, 1, 1] }
];

// Função que normaliza qualquer nota para a escala de 0 a 10 (preservada para dados antigos)
function normalizarNota(valor) {
    if (valor === null || valor === undefined || valor === "") {
        return null;
    }

    if (typeof valor === 'string') {
        valor = valor.replace(',', '.');
    }

    let num = Number(valor);

    if (isNaN(num)) {
        return null;
    }

    if (num > 10 && num <= 100) {
        num = num / 10;
    }

    if (num >= 0 && num <= 10) {
        return num;
    }

    return null;
}

// Função para formatar a nota para exibição na tela
function formatarExibicaoNota(nota) {
    if (nota === null) {
        return "—";
    }
    return nota.toFixed(1).replace('.', ',');
}

// Função principal que atualiza a interface (Tabela e Cards)
function renderizarBoletim() {
    const tabelaCorpo = document.getElementById("tabela-corpo");
    
    let somaMediasValidas = 0;
    let totalDisciplinasComMedia = 0;
    let totalFaltasGeral = 0;
    let qtdBomDesempenho = 0;
    let qtdAtencao = 0;

    // Limpa a tabela antes de preencher novamente
    tabelaCorpo.innerHTML = "";

    dadosBoletim.forEach((item, idx) => {
        const n1 = normalizarNota(item.tri1);
        const n2 = normalizarNota(item.tri2);
        const n3 = normalizarNota(item.tri3);

        // Tratamento de faltas de forma segura
        let f1 = 0, f2 = 0, f3 = 0;
        if (Array.isArray(item.faltas)) {
            f1 = item.faltas[0] || 0;
            f2 = item.faltas[1] || 0;
            f3 = item.faltas[2] || 0;
        } else if (item.faltas && typeof item.faltas === 'object') {
            f1 = item.faltas.tri1 || 0;
            f2 = item.faltas.tri2 || 0;
            f3 = item.faltas.tri3 || 0;
        }

        const totalFaltasDisciplina = f1 + f2 + f3;
        totalFaltasGeral += totalFaltasDisciplina;

        const notasDisponiveis = [n1, n2, n3].filter(n => n !== null);
        let media = null;
        let situacaoTexto = "Nota ainda não disponível";
        let classeCss = "situacao-indisponivel";

        if (notasDisponiveis.length > 0) {
            const somaNotas = notasDisponiveis.reduce((a, b) => a + b, 0);
            media = somaNotas / notasDisponiveis.length;

            somaMediasValidas += media;
            totalDisciplinasComMedia++;

            if (media >= 6.0) {
                situacaoTexto = "Bom desempenho";
                classeCss = "situacao-bom";
                qtdBomDesempenho++;
            } else {
                situacaoTexto = "Atenção";
                classeCss = "situacao-atencao";
                qtdAtencao++;
            }
        }

        const tr = document.createElement("tr");

        if (modoEdicao) {
            // Cria os campos de input no modo edição
            const tdDisc = document.createElement("td");
            tdDisc.textContent = item.disciplina;
            tr.appendChild(tdDisc);

            const v1 = item.tri1 === null || item.tri1 === undefined ? "" : item.tri1;
            const v2 = item.tri2 === null || item.tri2 === undefined ? "" : item.tri2;
            const v3 = item.tri3 === null || item.tri3 === undefined ? "" : item.tri3;

            tr.innerHTML += `
                <td><input type="text" class="input-tabela" data-idx="${idx}" data-field="tri1" value="${v1}"></td>
                <td><input type="text" class="input-tabela" data-idx="${idx}" data-field="tri2" value="${v2}"></td>
                <td><input type="text" class="input-tabela" data-idx="${idx}" data-field="tri3" value="${v3}"></td>
                <td><strong>${formatarExibicaoNota(media)}</strong></td>
                <td>
                    <input type="text" class="input-tabela" data-idx="${idx}" data-field="f1" value="${f1}" style="width:35px;">
                    <input type="text" class="input-tabela" data-idx="${idx}" data-field="f2" value="${f2}" style="width:35px;">
                    <input type="text" class="input-tabela" data-idx="${idx}" data-field="f3" value="${f3}" style="width:35px;">
                </td>
                <td class="${classeCss}">${situacaoTexto}</td>
            `;
        } else {
            // Visualização normal (Segurança DOM: inserindo nome da disciplina via textContent)
            const tdDisc = document.createElement("td");
            tdDisc.textContent = item.disciplina;
            tr.appendChild(tdDisc);

            const tdN1 = document.createElement("td");
            tdN1.textContent = formatarExibicaoNota(n1);
            tr.appendChild(tdN1);

            const tdN2 = document.createElement("td");
            tdN2.textContent = formatarExibicaoNota(n2);
            tr.appendChild(tdN2);

            const tdN3 = document.createElement("td");
            tdN3.textContent = formatarExibicaoNota(n3);
            tr.appendChild(tdN3);

            const tdMedia = document.createElement("td");
            tdMedia.innerHTML = `<strong>${formatarExibicaoNota(media)}</strong>`;
            tr.appendChild(tdMedia);

            const tdFaltas = document.createElement("td");
            tdFaltas.textContent = totalFaltasDisciplina;
            tr.appendChild(tdFaltas);

            const tdSit = document.createElement("td");
            tdSit.className = classeCss;
            tdSit.textContent = situacaoTexto;
            tr.appendChild(tdSit);
        }

        tabelaCorpo.appendChild(tr);
    });

    // Atualiza os Cards de Resumo (limpando e recalculando)
    const mediaGeralCalculada = totalDisciplinasComMedia > 0 ? (somaMediasValidas / totalDisciplinasComMedia) : null;
    document.getElementById("card-media").textContent = formatarExibicaoNota(mediaGeralCalculada);
    document.getElementById("card-faltas").textContent = totalFaltasGeral;
    document.getElementById("card-bom-desempenho").textContent = `${qtdBomDesempenho} disc.`;
    document.getElementById("card-atencao").textContent = `${qtdAtencao} disc.`;

    /* 
       NOTA SOBRE FREQUÊNCIA: 
       A frequência exibida abaixo (92%) é APENAS FICTÍCIA / DEMONSTRATIVA 
       e será calculada de forma dinâmica numa versão futura do projeto.
    */
    document.getElementById("card-frequencia").textContent = "92% (Frequência adequada)";

    // Atualiza a visualização dos gráficos com base nos dados atuais
    atualizarGraficos();
}

// Acesso ao Boletim via API
async function entrarBoletim() {
    const inputPin = document.getElementById("input-pin");
    const msg = document.getElementById("mensagem-login");
    const pin = inputPin.value.trim();

    if (!pin) {
        msg.className = "mensagem-status erro";
        msg.textContent = "Por favor, digite o PIN.";
        return;
    }

    msg.className = "mensagem-status";
    msg.textContent = "Conectando...";

    try {
        const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/abrir`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                turma: CONFIG_ALUNO.turma,
                numero_chamada: CONFIG_ALUNO.numeroChamada,
                pin: pin
            })
        });

        if (resposta.status === 401) {
            msg.className = "mensagem-status erro";
            msg.textContent = "Turma, chamada ou PIN inválidos.";
            return;
        }

        if (resposta.status === 429) {
            msg.className = "mensagem-status erro";
            msg.textContent = "Muitas tentativas. Aguarde um minuto e tente novamente.";
            return;
        }

        if (!resposta.ok) {
            msg.className = "mensagem-status erro";
            msg.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
            return;
        }

        const dadosRetornados = await resposta.json();
        pinSessao = pin;
        inputPin.value = ""; // Limpa a senha do campo por segurança

        // Se houver dados salvos na API, utiliza prioritariamente
        if (dadosRetornados && dadosRetornados.dados && Array.isArray(dadosRetornados.dados.disciplinas)) {
            dadosBoletim = dadosRetornados.dados.disciplinas;
        }

        // Esconde área de login e exibe o boletim
        document.getElementById("area-login").style.display = "none";
        document.getElementById("conteudo-boletim").style.display = "block";
        
        renderizarBoletim();

    } catch (erro) {
        msg.className = "mensagem-status erro";
        msg.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
    }
}

// Validação estrita de nota digitada na edição
function validarNotaDigitada(val) {
    if (val === "" || val === null || val === undefined) {
        return { valido: true, valor: null };
    }
    const strVal = String(val).replace(',', '.').trim();
    if (strVal === "") {
        return { valido: true, valor: null };
    }
    const num = Number(strVal);
    if (isNaN(num) || num < 0 || num > 10) {
        return { valido: false };
    }
    return { valido: true, valor: num };
}

// Validação estrita de faltas digitadas na edição
function validarFaltaDigitada(val) {
    const strVal = String(val).trim();
    if (strVal === "") {
        return { valido: false };
    }
    const num = Number(strVal);
    if (isNaN(num) || !Number.isInteger(num) || num < 0) {
        return { valido: false };
    }
    return { valido: true, valor: num };
}

// Alternar para modo edição
function ativarEdicao() {
    modoEdicao = true;
    document.getElementById("btn-alterar-dados").style.display = "none";
    document.getElementById("btn-salvar-dados").style.display = "inline-block";
    document.getElementById("btn-cancelar-edicao").style.display = "inline-block";
    document.getElementById("mensagem-edicao").textContent = "";
    renderizarBoletim();
}

// Cancelar edição
function cancelarEdicao() {
    modoEdicao = false;
    document.getElementById("btn-alterar-dados").style.display = "inline-block";
    document.getElementById("btn-salvar-dados").style.display = "none";
    document.getElementById("btn-cancelar-edicao").style.display = "none";
    document.getElementById("mensagem-edicao").textContent = "";
    renderizarBoletim();
}

// Salvar dados alterados na API
async function salvarAlteracoes() {
    const msg = document.getElementById("mensagem-edicao");
    const inputs = document.querySelectorAll("#tabela-corpo input.input-tabela");
    let houverErro = false;

    // Reseta marcas de erro visual nos inputs
    inputs.forEach(inp => inp.classList.remove("invalido"));

    // Copia profunda dos dados atuais para validar antes de salvar
    const novosDados = JSON.parse(JSON.stringify(dadosBoletim));

    inputs.forEach(input => {
        const idx = Number(input.getAttribute("data-idx"));
        const field = input.getAttribute("data-field");
        const val = input.value;

        if (field === "tri1" || field === "tri2" || field === "tri3") {
            const res = validarNotaDigitada(val);
            if (!res.valido) {
                input.classList.add("invalido");
                houverErro = true;
            } else {
                novosDados[idx][field] = res.valor;
            }
        } else if (field === "f1" || field === "f2" || field === "f3") {
            const res = validarFaltaDigitada(val);
            if (!res.valido) {
                input.classList.add("invalido");
                houverErro = true;
            } else {
                const fIndex = field === "f1" ? 0 : field === "f2" ? 1 : 2;
                if (!Array.isArray(novosDados[idx].faltas)) {
                    novosDados[idx].faltas = [0, 0, 0];
                }
                novosDados[idx].faltas[fIndex] = res.valor;
            }
        }
    });

    if (houverErro) {
        msg.className = "mensagem-status erro";
        msg.textContent = "Existem campos com valores inválidos. Verifique os destaques em vermelho.";
        return;
    }

    msg.className = "mensagem-status";
    msg.textContent = "Salvando...";

    try {
        const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/salvar`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                turma: CONFIG_ALUNO.turma,
                numero_chamada: CONFIG_ALUNO.numeroChamada,
                pin: pinSessao,
                dados: {
                    disciplinas: novosDados
                }
            })
        });

        if (!resposta.ok) {
            msg.className = "mensagem-status erro";
            msg.textContent = "Erro ao salvar alterações no servidor. Tente novamente.";
            return;
        }

        // Atualização bem-sucedida dos dados locais
        dadosBoletim = novosDados;
        modoEdicao = false;
        
        document.getElementById("btn-alterar-dados").style.display = "inline-block";
        document.getElementById("btn-salvar-dados").style.display = "none";
        document.getElementById("btn-cancelar-edicao").style.display = "none";
        
        msg.className = "mensagem-status sucesso";
        msg.textContent = "Dados salvos com sucesso!";

        renderizarBoletim();

    } catch (erro) {
        msg.className = "mensagem-status erro";
        msg.textContent = "Erro ao conectar com o servidor. Tente novamente.";
    }
}

// --- FUNÇÕES EXCLUSIVAS DOS GRÁFICOS (SOMENTE LEITURA) ---

function atualizarGraficoMedias() {
    const ctx = document.getElementById("graficoMediasDisciplinas");
    if (!ctx) return;

    if (graficoMedias) {
        graficoMedias.destroy();
    }

    const labels = [];
    const valores = [];

    dadosBoletim.forEach(item => {
        labels.push(item.disciplina);
        const n1 = normalizarNota(item.tri1);
        const n2 = normalizarNota(item.tri2);
        const n3 = normalizarNota(item.tri3);
        const disponiveis = [n1, n2, n3].filter(n => n !== null);

        if (disponiveis.length > 0) {
            const soma = disponiveis.reduce((a, b) => a + b, 0);
            valores.push(Number((soma / disponiveis.length).toFixed(1)));
        } else {
            valores.push(null);
        }
    });

    graficoMedias = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Média",
                data: valores,
                backgroundColor: "rgba(168, 85, 247, 0.7)",
                borderColor: "#a855f7",
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const val = context.raw;
                            if (val === null || val === undefined) return " Sem nota";
                            return " Média: " + val.toString().replace('.', ',');
                        }
                    }
                }
            },
            scales: {
                x: {
                    min: 0,
                    max: 10,
                    ticks: { color: "#c084fc" },
                    grid: { color: "#262626" }
                },
                y: {
                    ticks: { color: "#e0e0e0", font: { size: 11 } },
                    grid: { display: false }
                }
            }
        }
    });
}

function atualizarGraficoEvolucao() {
    const ctx = document.getElementById("graficoEvolucaoTrimestres");
    if (!ctx) return;

    if (graficoEvolucao) {
        graficoEvolucao.destroy();
    }

    const somaTri = [0, 0, 0];
    const qtdTri = [0, 0, 0];

    dadosBoletim.forEach(item => {
        const n1 = normalizarNota(item.tri1);
        const n2 = normalizarNota(item.tri2);
        const n3 = normalizarNota(item.tri3);

        if (n1 !== null) { somaTri[0] += n1; qtdTri[0]++; }
        if (n2 !== null) { somaTri[1] += n2; qtdTri[1]++; }
        if (n3 !== null) { somaTri[2] += n3; qtdTri[2]++; }
    });

    const mediasEvolucao = [
        qtdTri[0] > 0 ? Number((somaTri[0] / qtdTri[0]).toFixed(1)) : null,
        qtdTri[1] > 0 ? Number((somaTri[1] / qtdTri[1]).toFixed(1)) : null,
        qtdTri[2] > 0 ? Number((somaTri[2] / qtdTri[2]).toFixed(1)) : null
    ];

    graficoEvolucao = new Chart(ctx, {
        type: "line",
        data: {
            labels: ["1º Tri", "2º Tri", "3º Tri"],
            datasets: [{
                label: "Média Geral",
                data: mediasEvolucao,
                borderColor: "#c084fc",
                backgroundColor: "rgba(192, 132, 252, 0.2)",
                borderWidth: 3,
                fill: true,
                tension: 0.3,
                pointRadius: 5,
                pointBackgroundColor: "#a855f7"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const val = context.raw;
                            if (val === null) return " Sem notas no trimestre";
                            return " Média geral: " + val.toString().replace('.', ',');
                        }
                    }
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: 10,
                    ticks: { color: "#c084fc" },
                    grid: { color: "#262626" }
                },
                x: {
                    ticks: { color: "#e0e0e0" },
                    grid: { color: "#262626" }
                }
            }
        }
    });
}

function atualizarGraficoFaltas() {
    const ctx = document.getElementById("graficoFaltasTrimestres");
    if (!ctx) return;

    if (graficoFaltas) {
        graficoFaltas.destroy();
    }

    let fTri1 = 0, fTri2 = 0, fTri3 = 0;

    dadosBoletim.forEach(item => {
        if (Array.isArray(item.faltas)) {
            fTri1 += item.faltas[0] || 0;
            fTri2 += item.faltas[1] || 0;
            fTri3 += item.faltas[2] || 0;
        } else if (item.faltas && typeof item.faltas === 'object') {
            fTri1 += item.faltas.tri1 || 0;
            fTri2 += item.faltas.tri2 || 0;
            fTri3 += item.faltas.tri3 || 0;
        }
    });

    const totalFaltasAcumuladas = fTri1 + fTri2 + fTri3;
    const LIMITE_REFERENCIA_INTERNO = 350;

    const elEstado = document.getElementById("estadoFaltas");
    const cardFaltas = document.getElementById("card-faltas-grafico");

    if (elEstado && cardFaltas) {
        if (totalFaltasAcumuladas >= LIMITE_REFERENCIA_INTERNO) {
            elEstado.innerHTML = '<span class="badge-perigo">Perigo</span>';
            cardFaltas.classList.add("perigo-card");
        } else {
            elEstado.innerHTML = "";
            cardFaltas.classList.remove("perigo-card");
        }
    }

    graficoFaltas = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["1º Tri", "2º Tri", "3º Tri"],
            datasets: [{
                label: "Faltas",
                data: [fTri1, fTri2, fTri3],
                backgroundColor: "rgba(126, 34, 206, 0.7)",
                borderColor: "#7e22ce",
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return " Faltas: " + context.raw;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: "#c084fc", stepSize: 1 },
                    grid: { color: "#262626" }
                },
                x: {
                    ticks: { color: "#e0e0e0" },
                    grid: { color: "#262626" }
                }
            }
        }
    });
}

function atualizarGraficos() {
    atualizarGraficoMedias();
    atualizarGraficoEvolucao();
    atualizarGraficoFaltas();
}

// Configura eventos quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btn-entrar").addEventListener("click", entrarBoletim);
    document.getElementById("input-pin").addEventListener("keypress", (e) => {
        if (e.key === "Enter") entrarBoletim();
    });
    document.getElementById("btn-alterar-dados").addEventListener("click", ativarEdicao);
    document.getElementById("btn-salvar-dados").addEventListener("click", salvarAlteracoes);
    document.getElementById("btn-cancelar-edicao").addEventListener("click", cancelarEdicao);
});