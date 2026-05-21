import { Component, Input } from "@angular/core";
import { ProductAudit } from "../../domain/product.model";
import { CommonModule } from "@angular/common";

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="list-container">
      @for (item of productsList; track item.barcode) {
        <div class="product-item"
             [ngClass]="{
               'status-pending': item.countedQuantity === 0,
               'status-success': item.countedQuantity === item.systemQuantity,
               'status-warning': item.countedQuantity > 0 && item.countedQuantity !== item.systemQuantity
             }">
          <div class="product-info">
            <h3>{{ item.description }}</h3>
            <p class="meta">
              EAN: <span class="barcode">{{ item.barcode }}</span> | 
              <span class="location-tag">{{ item.location }}</span>
            </p>
          </div>
          
          <div class="product-progress">
            <span class="progress-label">Progresso</span>
            <span class="progress-value">
              {{ item.countedQuantity }} / {{ item.systemQuantity }}
            </span>
          </div>
        </div>
      } @empty {
        <div class="empty-state">
          <p>Nenhum item importado do TOTVS para esta rota.</p>
          <span>Selecione o arquivo de template CSV para carregar o inventário.</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .list-container {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      background-color: #0f172a;
    }

    .product-item {
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid #475569;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.2s ease;

      /* Estados Dinâmicos baseados no WMS */
      &.status-pending {
        background-color: #1e293b;
        border-color: #334155;
        .progress-value { color: #94a3b8; }
      }
      &.status-success {
        background-color: rgba(16, 185, 129, 0.08);
        border-color: rgba(16, 185, 129, 0.4);
        .progress-value { color: #10b981; }
      }
      &.status-warning {
        background-color: rgba(245, 158, 11, 0.08);
        border-color: rgba(245, 158, 11, 0.4);
        .progress-value { color: #f59e0b; }
      }
    }

    .product-info {
      h3 { font-size: 0.875rem; font-weight: 700; color: #f8fafc; }
      .meta { font-size: 0.75rem; color: #94a3b8; margin-top: 0.25rem; }
      .barcode { font-family: monospace; color: #cbd5e1; }
      .location-tag {
        color: #10b981;
        background: rgba(16, 185, 129, 0.1);
        padding: 0.125rem 0.375rem;
        border-radius: 4px;
        font-weight: 500;
      }
    }

    .product-progress {
      text-align: right;
      min-w: 80px;
      
      .progress-label {
        display: block;
        font-size: 0.65rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #64748b;
        font-weight: 600;
      }
      .progress-value {
        font-family: monospace;
        font-size: 1rem;
        font-weight: 700;
        margin-top: 0.125rem;
        display: block;
      }
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      border: 2px dashed #334155;
      border-radius: 12px;
      p { font-size: 0.875rem; color: #64748b; font-weight: 500; }
      span { font-size: 0.75rem; color: #475569; display: block; margin-top: 0.25rem; }
    }
  `]
})
export class ProductListComponent {
  @Input({ required: true }) productsList: ProductAudit[] = [];
}