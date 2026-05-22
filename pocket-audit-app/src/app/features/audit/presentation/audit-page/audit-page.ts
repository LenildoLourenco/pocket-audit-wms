import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScannerViewComponent } from '../scanner-view/scanner-view';
import { ProductListComponent } from '../product-list/product-list';
import { ProductAudit, AuditScanLog } from '../../domain/product.model';
import { OfflineStorageService } from '../../../../core/services/offline-storage.service';

@Component({
  selector: 'app-audit-page',
  standalone: true,
  imports: [CommonModule, ScannerViewComponent, ProductListComponent],
  templateUrl: './audit-page.html',
  styleUrls: ['./audit-page.scss']
})
export class AuditPageComponent {
  public offlineService = inject(OfflineStorageService);
  // Estado da Aplicação usando Signals do Angular
  public products = signal<ProductAudit[]>([]);
  public scanLogs = signal<AuditScanLog[]>([]);
  
  // Parâmetros de Governança WMS
  public currentUser = 'OP-Lenildo'; 
  public isBlindMode = signal<boolean>(true); // Ativa/Desativa Contagem Cega
  public isInventoryClosed = signal<boolean>(false); // Modo conferência ativado pelo fechamento
  
  // Controle de interface para captura de foto
  public selectedProductForPhoto = signal<ProductAudit | null>(null);

  // COMPUTED SIGNALS: Cálculos de Alta Performance reativos a múltiplos usuários
  public totalSystemQuantity = computed(() => 
    this.products().reduce((acc, p) => acc + p.systemQuantity, 0)
  );

  public totalCountedQuantity = computed(() => 
    this.products().reduce((acc, p) => acc + p.countedQuantity, 0)
  );

  // INPUT/IO: Carga Inicial do CSV
  public onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      this.parseCSV(text);
    };
    reader.readAsText(file);
  }

  private parseCSV(text: string): void {
  const lines = text.split('\n');
  const loadedProducts: ProductAudit[] = [];

  // Ignora o cabeçalho e mapeia as linhas do CSV
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const columns = line.split(',');
    if (columns.length >= 4) {
      const barcode = columns[0].trim();
      const description = columns[1].trim();
      const location = columns[2].trim();
      const systemQuantity = parseInt(columns[3].trim(), 10) || 0;

      // Injeta propriedades padrão de WMS para bater com a interface ProductAudit
      loadedProducts.push({
        barcode,
        description,
        location,
        systemQuantity,
        countedQuantity: 0,
        
        // --- Fallbacks para satisfazer o compilador TypeScript ---
        abcZone: 'C',              // Por padrão todo item entra na curva C até segunda ordem
        pickingType: 'Unidade',    // Tipo padrão de movimentação
        street: location.substring(0, 3) || '01', // Tenta inferir a rua pelo início do endereço
        block: '01'                // Bloco padrão inicial
      });
    }
  }
  this.products.set(loadedProducts);
  this.scanLogs.set([]); // Zera os logs da rota anterior
  this.isInventoryClosed.set(false);
}

  // MOTOR MULTIUSUÁRIO: Processamento de Bipes via Registro de Logs
  public onBarcodeScrolled(barcode: string): void {
  if (this.isInventoryClosed()) return;

  const matchedProduct = this.products().find(p => p.barcode === barcode);
  if (!matchedProduct) return; 

  const newLog: AuditScanLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    operatorId: this.currentUser,
    barcode: barcode,
    location: matchedProduct.location,
    timestamp: Date.now(),
    quantity: 1
  };

  // SALVAMENTO RESILIENTE: Salva localmente e tenta subir para a nuvem
  this.offlineService.saveScanLog(newLog);

  // Atualiza a tela reativamente na mesma hora
  this.scanLogs.update(logs => [...logs, newLog]);
  this.products.update(allProducts => 
    allProducts.map(p => p.barcode === barcode 
      ? { ...p, countedQuantity: p.countedQuantity + 1 }
      : p
    )
  );
}

  // Simulação de entrada simultânea: Outro operador postando bipes na rede
  public simulateExternalOperatorScan(barcode: string, opId: string): void {
    const matchedProduct = this.products().find(p => p.barcode === barcode);
    if (!matchedProduct) return;

    const externalLog: AuditScanLog = {
      id: `log-${Date.now()}`,
      operatorId: opId,
      barcode: barcode,
      location: matchedProduct.location,
      timestamp: Date.now(),
      quantity: 1
    };

    this.scanLogs.update(logs => [...logs, externalLog]);
    this.products.update(allProducts => 
      allProducts.map(p => p.barcode === barcode 
        ? { ...p, countedQuantity: p.countedQuantity + 1 }
        : p
      )
    );
  }

  // MOTOR DE EVIDÊNCIA: Ativa captura de foto para o item selecionado
  public openCameraCapture(product: ProductAudit): void {
    this.selectedProductForPhoto.set(product);
  }

  public handlePhotoCaptured(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      const base64Image = reader.result as string;
      const targetProduct = this.selectedProductForPhoto();

      if (targetProduct) {
        // Vincula a foto capturada diretamente ao SKU divergente no estado
        this.products.update(allProducts =>
          allProducts.map(p => p.barcode === targetProduct.barcode
            ? { ...p, evidenceImage: base64Image }
            : p
          )
        );
        this.selectedProductForPhoto.set(null); // Fecha a interface de câmera
        alert(`Evidência fotográfica registrada com sucesso para o item!`);
      }
    };
    reader.readAsDataURL(file);
  }

  // COMANDO DE CONCILIAÇÃO: Encerra o lote cego e exibe o relatório de divergências
  public closeAuditLote(): void {
    this.isInventoryClosed.set(true);
  }

  // EXPORT: Gera arquivo final cruzando os dados de Sobra, Falta e Logs de Operador
  public exportAdjustment(): void {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'EAN,Descricao,Endereco,Esperado,Contado,Divergencia,Status,FotoEvidencia\n';

    this.products().forEach(p => {
      const diff = p.countedQuantity - p.systemQuantity;
      let status = 'ACURADO';
      if (diff < 0) status = 'FALTA';
      if (diff > 0) status = 'SOBRA';

      const hasPhoto = p.evidenceImage ? 'SIM_ANEXADA' : 'NAO';

      csvContent += `${p.barcode},${p.description},${p.location},${p.systemQuantity},${p.countedQuantity},${diff},${status},${hasPhoto}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CONCILIACAO_WMS_LOTE_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}