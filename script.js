// Dados brutos fictícios do 9º Ano
const dadosBoletim = [
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

// Função que normaliza qualquer nota para a escala de 0 a 10
function normalizarNota(valor) {
    if (valor === null || valor === undefined || valor === "") {
        return null; // Nota ausente
    }

    // Se for texto com vírgula, substitui por ponto
    if (typeof valor === 'string') {
        valor = valor.replace(',', '.');
    }

    let num = Number(valor);

    // Se não for um número válido, descarta
    if (isNaN(num)) {
        return null;
    }

    // Se o valor for maior que 10 e menor ou igual a 100, divide por 10
    if (num > 10 && num <= 100) {
        num = num / 10;
    }

    // Aceita apenas valores finais entre 0 e 10
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

// Função principal que processa os dados e preenche o HTML
function carregarBoletim() {
    const tabelaCorpo = document.getElementById("tabela-corpo");
    
    let somaMediasValidas = 0;
    let totalDisciplinasComMedia = 0;
    let totalFaltasGeral = 0;
    let qtdBomDesempenho = 0;
    let qtdAtencao = 0;

    // Limpa o corpo da tabela antes de preencher
    tabelaCorpo.innerHTML = "";

    // Processa cada disciplina
    dadosBoletim.forEach((item) => {
        // Normaliza as notas de cada trimestre
        const n1 = normalizarNota(item.tri1);
        const n2 = normalizarNota(item.tri2);
        const n3 = normalizarNota(item.tri3);

        // Calcula a soma das faltas do ano
        const totalFaltasDisciplina = item.faltas.reduce((a, b) => a + b, 0);
        totalFaltasGeral += totalFaltasDisciplina;

        // Calcula a média considerando APENAS notas existentes (não nulas)
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

        // Cria a linha na tabela via DOM
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${item.disciplina}</td>
            <td>${formatarExibicaoNota(n1)}</td>
            <td>${formatarExibicaoNota(n2)}</td>
            <td>${formatarExibicaoNota(n3)}</td>
            <td><strong>${formatarExibicaoNota(media)}</strong></td>
            <td>${totalFaltasDisciplina}</td>
            <td class="${classeCss}">${situacaoTexto}</td>
        `;
        tabelaCorpo.appendChild(tr);
    });

    // Atualiza os Cards de Resumo
    const mediaGeralCalculada = totalDisciplinasComMedia > 0 ? (somaMediasValidas / totalDisciplinasComMedia) : null;
    document.getElementById("card-media").innerText = formatarExibicaoNota(mediaGeralCalculada);
    document.getElementById("card-faltas").innerText = totalFaltasGeral;
    document.getElementById("card-bom-desempenho").innerText = `${qtdBomDesempenho} disc.`;
    document.getElementById("card-atencao").innerText = `${qtdAtencao} disc.`;

    /* 
       NOTA SOBRE FREQUÊNCIA: 
       A frequência exibida abaixo (92%) é APENAS FICTÍCIA / DEMONSTRATIVA 
       e será calculada de forma dinâmica numa versão futura do projeto.
    */
    document.getElementById("card-frequencia").innerText = "92% (Frequência adequada)";
}

// Executa a função assim que a página carregar
document.addEventListener("DOMContentLoaded", carregarBoletim);