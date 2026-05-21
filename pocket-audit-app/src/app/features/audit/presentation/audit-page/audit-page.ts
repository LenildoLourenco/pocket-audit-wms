import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScannerViewComponent } from '../scanner-view/scanner-view';
import { ProductListComponent } from '../product-list/product-list';
import { AuditDbService } from '../../data/audit-db.service';
import { AuditIoService } from '../../data/audit-io.service';
import { ProductAudit } from '../../domain/product.model';

@Component({
  selector: 'app-audit-page',
  standalone: true,
  imports: [CommonModule, ScannerViewComponent, ProductListComponent],
  templateUrl: './audit-page.html',
  styleUrl: './audit-page.scss'
})
export class AuditPageComponent implements OnInit {
  private auditDbService = inject(AuditDbService);
  private ioService = inject(AuditIoService);

  public products = signal<ProductAudit[]>([]);

  // Evita o erro de NaN somando apenas valores numéricos válidos
  public totalSystemQuantity = computed(() => {
    return this.products().reduce((acc, p) => acc + (Number(p.systemQuantity) || 0), 0);
  });

  public totalCountedQuantity = computed(() => {
    return this.products().reduce((acc, p) => acc + (Number(p.countedQuantity) || 0), 0);
  });

  ngOnInit() {
    this.loadLocalData();
  }

  async loadLocalData() {
    const local = await this.auditDbService.getAllProducts();
    if (local && local.length > 0) {
      this.products.set(local);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const parsedProducts = this.ioService.parseCSV(text);
      this.products.set(parsedProducts);
      await this.auditDbService.saveBulk(parsedProducts);
    };
    reader.readAsText(file, 'UTF-8');
  }

  public onBarcodeScrolled(scenteredBarcode: string): void {
    this.products.update(currentProducts => {
      return currentProducts.map(product => {
        if (product.barcode === scenteredBarcode) {
          const updated = { ...product, countedQuantity: (Number(product.countedQuantity) || 0) + 1 };
          this.auditDbService.saveProduct(updated);
          return updated;
        }
        return product;
      });
    });
  }

  exportAdjustment() {
    this.ioService.exportReconciliationCSV(this.products());
  }
}