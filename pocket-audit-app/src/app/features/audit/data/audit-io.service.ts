import { Injectable } from '@angular/core';
import { ProductAudit } from '../domain/product.model';

@Injectable({
  providedIn: 'root'
})
export class AuditIoService {

  /**
   * Processa a string bruta do CSV e gera os objetos estruturados com metadados WMS
   */
  public parseCSV(csvText: string): ProductAudit[] {
    const lines = csvText.split('\n');
    const products: ProductAudit[] = [];
    
    // Ignora a primeira linha (cabeçalho) e linhas em branco
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const columns = line.split(',');
      if (columns.length < 4) continue;

      // Inserção limpa e verticalizada
      products.push({
        barcode: columns[0]?.trim(),
        description: columns[1]?.trim(),
        location: columns[2]?.trim(), 
        systemQuantity: Number(columns[3]) || 0,
        countedQuantity: Number(columns[4]) || 0,

        // --- Mapeamento Pró da Regra de Negócio Verticalizada ---
        abcZone: (columns[5]?.trim().toUpperCase() as 'A' | 'B' | 'C') || 'C',
        pickingType: (columns[6]?.trim() as 'Unidade' | 'Caixa' | 'Palete') || 'Unidade',
        
        // Separação de Rua e Bloco baseada no caractere "-" do endereço do WMS
        street: columns[2] ? columns[2].split('-')[0]?.trim() : '99',
        block: columns[2] ? columns[2].split('-')[1]?.trim() : 'Z'
      });
    } // Fim do laço For
    
    return products;
  }

  /**
   * Gera o arquivo de conciliação apontando sobras e faltas para o ERP/TOTVS
   */
  public exportReconciliationCSV(products: ProductAudit[]): void {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'barcode,description,location,systemQuantity,countedQuantity,variance,status,abcZone,pickingType\n';

    products.forEach(p => {
      const variance = p.countedQuantity - p.systemQuantity;
      let status = 'OK';
      
      if (variance < 0) status = 'FALTA';
      if (variance > 0) status = 'SOBRA';

      // Exporta incluindo as novas métricas para manter o histórico íntegro no ERP
      const row = `${p.barcode},${p.description},${p.location},${p.systemQuantity},${p.countedQuantity},${variance},${status},${p.abcZone},${p.pickingType}`;
      csvContent += row + '\n';
    });

    // Gatilho de download nativo no navegador do coletor
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CONCILIACAO_WMS_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}