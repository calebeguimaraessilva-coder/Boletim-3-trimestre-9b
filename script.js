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