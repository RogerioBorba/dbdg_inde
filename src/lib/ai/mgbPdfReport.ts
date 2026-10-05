// src/lib/ai/mgbPdfReport.ts
/**
 * Gerador de Relatório PDF de Avaliação Semântica MGB 2.0 por IA.
 * Utiliza jsPDF para compor um relatório executivo e técnico detalhado
 * das diretrizes do Perfil MGB 2.0 (INDE/IBGE).
 */

import { jsPDF } from 'jspdf';
import type { MGBSemanticEvaluation } from './types';

export function generateMGBSemanticPdfReport(
    evaluation: MGBSemanticEvaluation,
    metadataId?: string,
    metadataTitle?: string
): jsPDF {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 36;
    const contentWidth = pageWidth - margin * 2;
    let y = 36;

    function checkPageBreak(neededHeight: number): void {
        if (y + neededHeight > pageHeight - margin - 20) {
            doc.addPage();
            y = margin;
        }
    }

    function addWrappedText(
        text: string,
        fontSize: number,
        isBold = false,
        rgbColor: [number, number, number] = [30, 41, 59],
        lineSpacing = 4,
        indent = 0
    ): void {
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.setFontSize(fontSize);
        doc.setTextColor(rgbColor[0], rgbColor[1], rgbColor[2]);
        const lines = doc.splitTextToSize(text, contentWidth - indent);
        const lineHeight = fontSize + lineSpacing;

        for (const line of lines) {
            checkPageBreak(lineHeight);
            doc.text(line, margin + indent, y);
            y += lineHeight;
        }
    }

    // 1. Banner de Cabeçalho
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(margin, y, contentWidth, 54, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('RELATÓRIO DE AVALIAÇÃO SEMÂNTICA DE METADADOS', margin + 14, y + 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text('Perfil MGB 2.0 (INDE / IBGE) — Auditoria Especialista por Inteligência Artificial', margin + 14, y + 38);
    y += 66;

    // 2. Metadados do Registro e Emissão
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(margin, y, contentWidth, 70, 4, 4, 'FD');

    const evalTitle = evaluation.title || metadataTitle || 'Não informado';
    const evalId = evaluation.metadataId || metadataId || 'Não informado';
    const evalDate = new Date(evaluation.evaluatedAt || new Date()).toLocaleString('pt-BR');
    const motorName = evaluation.provider === 'heuristic'
        ? 'Especialista MGB Heurístico (Local)'
        : `${evaluation.provider.toUpperCase()}${evaluation.model ? ` (${evaluation.model})` : ''}`;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('Título do Recurso:', margin + 10, y + 16);
    doc.setFont('helvetica', 'normal');
    const titleLines = doc.splitTextToSize(evalTitle, contentWidth - 110);
    doc.text(titleLines[0] || '', margin + 105, y + 16);

    doc.setFont('helvetica', 'bold');
    doc.text('Identificador:', margin + 10, y + 32);
    doc.setFont('helvetica', 'normal');
    doc.text(evalId, margin + 85, y + 32);

    doc.setFont('helvetica', 'bold');
    doc.text('Quadro Avaliado:', margin + 10, y + 48);
    doc.setFont('helvetica', 'normal');
    doc.text(`${evaluation.quadroTitle} (Quadro ${evaluation.quadroId})`, margin + 100, y + 48);

    doc.setFont('helvetica', 'bold');
    doc.text('Motor de Análise:', margin + 10, y + 62);
    doc.setFont('helvetica', 'normal');
    doc.text(`${motorName}  |  Emissão: ${evalDate}`, margin + 100, y + 62);

    y += 82;

    // 3. Bloco Executivo de Nota e Parecer do Auditor
    checkPageBreak(90);
    const scoreBoxWidth = 110;
    const textBoxWidth = contentWidth - scoreBoxWidth - 10;

    // Caixa de Pontuação
    let scoreColor: [number, number, number] = [225, 29, 72]; // rose-600
    if (evaluation.score >= 90) scoreColor = [5, 150, 105]; // emerald-600
    else if (evaluation.score >= 75) scoreColor = [2, 132, 199]; // sky-600
    else if (evaluation.score >= 50) scoreColor = [217, 119, 6]; // amber-600

    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, scoreBoxWidth, 78, 4, 4, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('NOTA SEMÂNTICA', margin + 14, y + 16);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.text(`${evaluation.score}`, margin + 14, y + 46);

    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text('/ 100', margin + 60, y + 46);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.text(`Conceito: ${evaluation.rating}`, margin + 14, y + 66);

    // Caixa de Diagnóstico Textual
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin + scoreBoxWidth + 10, y, textBoxWidth, 78, 4, 4, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('DIAGNÓSTICO EXECUTIVO DO AUDITOR DE IA', margin + scoreBoxWidth + 20, y + 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const feedbackLines = doc.splitTextToSize(evaluation.summaryFeedback, textBoxWidth - 20);
    let fY = y + 28;
    for (const fLine of feedbackLines.slice(0, 4)) {
        doc.text(fLine, margin + scoreBoxWidth + 20, fY);
        fY += 11;
    }

    y += 90;

    // 4. Desempenho por Dimensão Semântica
    checkPageBreak(130);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('1. DESEMPENHO POR DIMENSÃO SEMÂNTICA', margin, y);
    y += 10;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, margin + contentWidth, y);
    y += 12;

    for (const dim of evaluation.dimensions) {
        checkPageBreak(32);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text(`${dim.name} (${dim.weight}%)`, margin, y);

        doc.setFont('helvetica', 'bold');
        doc.text(`${dim.score} / 100`, margin + contentWidth - 45, y);

        // Barra de progresso visual
        y += 4;
        doc.setFillColor(226, 232, 240);
        doc.roundedRect(margin, y, contentWidth, 5, 2, 2, 'F');

        let barColor: [number, number, number] = [225, 29, 72];
        if (dim.score >= 85) barColor = [5, 150, 105];
        else if (dim.score >= 70) barColor = [2, 132, 199];
        else if (dim.score >= 50) barColor = [217, 119, 6];

        const barWidth = Math.max(4, Math.round((contentWidth * dim.score) / 100));
        doc.setFillColor(barColor[0], barColor[1], barColor[2]);
        doc.roundedRect(margin, y, barWidth, 5, 2, 2, 'F');

        y += 11;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(dim.feedback, margin, y);
        y += 12;
    }

    y += 8;

    // 5. Pontos Fortes e Ações Prioritárias
    checkPageBreak(120);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('2. PONTOS FORTES E AÇÕES PRIORITÁRIAS DE MELHORIA', margin, y);
    y += 10;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, margin + contentWidth, y);
    y += 12;

    const colWidth = (contentWidth - 12) / 2;
    const col2X = margin + colWidth + 12;
    const topColY = y;

    // Coluna: Pontos Fortes
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(5, 150, 105);
    doc.text('PONTOS FORTES IDENTIFICADOS:', margin, y);
    let yCol1 = y + 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    for (const st of evaluation.strengths) {
        const sLines = doc.splitTextToSize(`• ${st}`, colWidth);
        for (const line of sLines) {
            doc.text(line, margin, yCol1);
            yCol1 += 10;
        }
    }

    // Coluna: Ações Prioritárias
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(217, 119, 6);
    doc.text('AÇÕES PRIORITÁRIAS DE MELHORIA:', col2X, topColY);
    let yCol2 = topColY + 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    for (const imp of evaluation.priorityImprovements) {
        const iLines = doc.splitTextToSize(`• ${imp}`, colWidth);
        for (const line of iLines) {
            doc.text(line, col2X, yCol2);
            yCol2 += 10;
        }
    }

    y = Math.max(yCol1, yCol2) + 14;

    // 6. Análise Detalhada dos Elementos do Quadro MGB
    checkPageBreak(80);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('3. ANÁLISE DETALHADA POR ELEMENTO DO QUADRO MGB & SUGESTÕES', margin, y);
    y += 10;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, margin + contentWidth, y);
    y += 14;

    for (const el of evaluation.elementEvaluations) {
        checkPageBreak(50);

        // Header do elemento
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(`Elemento ${el.elementId} — ${el.elementName}`, margin, y);

        // Status badge
        let statusRgb: [number, number, number] = [225, 29, 72];
        let statusText = 'INADEQUADO';
        if (el.status === 'adequado') {
            statusRgb = [5, 150, 105];
            statusText = 'ADEQUADO';
        } else if (el.status === 'parcial') {
            statusRgb = [217, 119, 6];
            statusText = 'PARCIAL';
        }

        doc.setTextColor(statusRgb[0], statusRgb[1], statusRgb[2]);
        doc.text(`[${statusText}]`, margin + contentWidth - 80, y);
        y += 11;

        // Snippet atual
        if (el.currentSnippet) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(100, 116, 139);
            const snipLines = doc.splitTextToSize(`Conteúdo atual: "${el.currentSnippet}"`, contentWidth);
            for (const sLine of snipLines.slice(0, 2)) {
                checkPageBreak(10);
                doc.text(sLine, margin, y);
                y += 10;
            }
        }

        // Crítica semântica
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        const cLines = doc.splitTextToSize(`Parecer: ${el.critique}`, contentWidth);
        for (const cLine of cLines) {
            checkPageBreak(10);
            doc.text(cLine, margin, y);
            y += 10;
        }

        // Sugestão de melhoria
        if (el.suggestedImprovement) {
            y += 2;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(67, 56, 202); // indigo-700
            checkPageBreak(10);
            doc.text('Sugestão de Aprimoramento da IA:', margin + 8, y);
            y += 9;

            doc.setFont('helvetica', 'normal');
            doc.setTextColor(30, 27, 75); // indigo-950
            const sugLines = doc.splitTextToSize(el.suggestedImprovement, contentWidth - 16);
            for (const sLine of sugLines) {
                checkPageBreak(9);
                doc.text(sLine, margin + 8, y);
                y += 9;
            }
        }

        y += 8;
        doc.setDrawColor(241, 245, 249);
        doc.line(margin, y, margin + contentWidth, y);
        y += 8;
    }

    // 7. Rodapé em todas as páginas com numeração
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);

        doc.text(
            'DBDG INDE — Avaliação Semântica MGB 2.0 (IBGE liv101802.pdf)',
            margin,
            pageHeight - 20
        );

        doc.text(
            `Página ${p} de ${totalPages}`,
            pageWidth - margin - 55,
            pageHeight - 20
        );
    }

    return doc;
}

export function downloadMGBSemanticPdfReport(
    evaluation: MGBSemanticEvaluation,
    metadataId?: string,
    metadataTitle?: string
): void {
    const doc = generateMGBSemanticPdfReport(evaluation, metadataId, metadataTitle);
    const safeId = (evaluation.metadataId || metadataId || 'metadado').replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(`relatorio_mgb_ia_${safeId}.pdf`);
}
