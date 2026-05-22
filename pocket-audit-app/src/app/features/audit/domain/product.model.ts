export interface ProductAudit {
  barcode: string;         // Código de Barras (EAN-13 / CODE-128)
  description: string;     // Descrição do Item (Ex: Shampoo Hidratação 400ml)
  location: string;        // Endereço completo (Ex: 01A0203 -> Rua 01, Bloco A, Nível 02, Apto 03)
  systemQuantity: number;  // Saldo do TOTVS / ERP
  countedQuantity: number; // Contagem física realizada pelo operador

  // --- Upgrade Operacional ---
  evidenceImage?: string; // String em Base64 da foto tirada pelo operador
  
  // --- Novos Campos de Verticalização WMS ---
  abcZone: 'A' | 'B' | 'C'; // Classificação Curva ABC para prioridade
  pickingType: 'Unidade' | 'Caixa' | 'Palete'; // Tipo de separação / unitarização
  street: string;          // Rua do galpão (para roteirização)
  block: string;           // Bloco / Coluna do rack
}

// Estrutura de Log Imutável para Concorrência Multiusuário
export interface AuditScanLog {
  id: string;          // ID único do log (UUID ou timestamp)
  operatorId: string;  // Identificador do operador (Ex: "OP-04", "lenildo")
  barcode: string;     // SKU bipado
  location: string;    // Onde foi bipado
  timestamp: number;   // Hora exata do bipe
  quantity: number;    // Quantidade somada (+1 por padrão)
}