import {jsPDF} from "jspdf"

/**
 * Connverte um array de objetos em um documento pdf. 
 * @param {Array<Object>} elements - O array é recebido  e os objetos que estão dentro dele que 
 * faram parte do pdf
 * @returns {void} 
 */

export function dataToPdf(elements: any) {
    let pdf = new jsPDF();
    let y = 5;
    const pageHeight = pdf.internal.pageSize.height;
    pdf.setFont("courier", "bold");
    pdf.setFontSize(10);
    const lineSpacing = 4;

    for (const objeto of elements) {
        for (const [chave, valor] of Object.entries(objeto)) {
            let text = `${chave}: ${valor}`;
            let textLines = pdf.splitTextToSize(text, 190);

            if (y + (textLines.length * 5) > pageHeight) {
                pdf.addPage();
                y = 5;
            }

            pdf.setFillColor(240, 240, 240);
            pdf.rect(10, y - 3, 190, pdf.getTextDimensions(textLines).h + 8, 'F');
            pdf.text(textLines, 10, y);

            // Atualiza a posição Y para a próxima linha
            y += pdf.getTextDimensions(textLines).h + lineSpacing;
        }

        y += 10;
    }

    pdf.save("relatorio.pdf");
}


export function bodyToPDF(anElementHTML: HTMLElement) {
    const doc = new jsPDF('p', 'pt', 'letter');
    const elementHTML = anElementHTML || document.body;
    const buttons = document.querySelectorAll('button');
    
    // Esconde os botões temporariamente
    buttons.forEach(button => button.style.display = 'none');

    doc.html(elementHTML, {
        callback: function(doc: { save: (arg0: string) => void; }) {
            // Salva o PDF
            doc.save('doc.pdf');

            // Restaura a exibição dos botões
            buttons.forEach(button => button.style.display = '');
        },

        margin: [10, 10, 10, 10],
       // autoPaging: 'html',
        x: 0,
        y: 0,
        width: 550, // Largura alvo no documento PDF
        windowWidth: 900 // Largura da janela em pixels CSS
    });
};