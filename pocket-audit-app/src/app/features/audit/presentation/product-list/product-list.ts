import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductAudit } from '../../domain/product.model';

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
               'status-counting': item.countedQuantity > 0,
               'status-divergent-short': isClosed && item.countedQuantity < item.systemQuantity,
               'status-divergent-over': isClosed && item.countedQuantity > item.systemQuantity,
               'status-exact': isClosed && item.countedQuantity === item.systemQuantity
             }">
          
          <div class="product-info">
            <h3>{{ item.description }}</h3>
            <p class="meta">
              EAN: <span class="barcode">{{ item.barcode }}</span> | 
              <span class="location-tag">📍 {{ item.location }}</span>
            </p>
            
            @if (isClosed) {
              <div class="audit-badges">
                @if (item.countedQuantity === item.systemQuantity) {
                  <span class="badge badge-ok">Acuracidade 100%</span>
                } @else if (item.countedQuantity < item.systemQuantity) {
                  <span class="badge badge-short">Falta: {{ item.systemQuantity - item.countedQuantity }} un</span>
                } @else {
                  <span class="badge badge-over">Sobra: {{ item.countedQuantity - item.systemQuantity }} un</span>
                }
              </div>
            }
          </div>
          
          <div class="product-actions-progress">
            <div class="text-right">
              <span class="progress-label">Físico Contado</span>
              <span class="progress-value">{{ item.countedQuantity }} unidades</span>
              
              @if (!isBlind) {
                <span class="expected-sub">Esperado: {{ item.systemQuantity }}</span>
              } @else {
                <span class="expected-sub font-italic">Contagem Cega Ativa</span>
              }
            </div>

            @if (isClosed && item.countedQuantity !== item.systemQuantity) {
              <button class="btn-camera-evidence" (click)="triggerPhotoCapture.emit(item)">
                📸 Registrar Evidência
              </button>
            }
          </div>

        </div>
      } @empty {
        <div class="empty-state">
          <p>Nenhuma rota ou endereço alocado para o seu usuário.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .list-container { padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; background-color: #0f172a; }
    
    .product-item {
      padding: 1.25rem; border-radius: 8px; border: 1px solid #334155;
      display: flex; justify-content: space-between; align-items: center;
      transition: all 0.2s ease; background-color: #1e293b;

      &.status-pending { border-left: 4px solid #64748b; }
      &.status-counting { border-left: 4px solid #3b82f6; background-color: rgba(59, 130, 246, 0.03); }
      
      /* Cores de fechamento pós-auditoria */
      &.status-exact { border-left: 4px solid #10b981; background-color: rgba(16, 185, 129, 0.05); }
      &.status-divergent-short { border-left: 4px solid #ef4444; background-color: rgba(239, 68, 68, 0.05); }
      &.status-divergent-over { border-left: 4px solid #a855f7; background-color: rgba(168, 85, 247, 0.05); }
    }

    .product-info {
      h3 { font-size: 0.9rem; font-weight: 700; color: #f8fafc; }
      .meta { font-size: 0.75rem; color: #94a3b8; margin-top: 0.25rem; }
      .barcode { font-family: monospace; color: #cbd5e1; }
      .location-tag { color: #38bdf8; font-weight: 600; }
    }

    .audit-badges {
      display: flex; gap: 0.5rem; margin-top: 0.5rem;
      .badge {
        font-size: 0.65rem; font-weight: 700; padding: 0.125rem 0.5rem; border-radius: 4px; text-transform: uppercase;
        &-ok { background: rgba(16, 185, 129, 0.15); color: #10b981; }
        &-short { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
        &-over { background: rgba(168, 85, 247, 0.15); color: #a855f7; }
      }
    }

    .product-actions-progress {
      display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;
      
      .progress-label { display: block; font-size: 0.65rem; text-transform: uppercase; color: #64748b; font-weight: 600; }
      .progress-value { font-size: 0.95rem; font-weight: 700; color: #f8fafc; display: block; }
      .expected-sub { font-size: 0.7rem; color: #64748b; display: block; }
      .font-italic { font-style: italic; color: #475569; }
    }

    .btn-camera-evidence {
      background: #dc2626; color: white; border: none; padding: 0.35rem 0.75rem;
      border-radius: 6px; font-size: 0.7rem; font-weight: 600; cursor: pointer;
      transition: background 0.2s;
      &:hover { background: #b91c1c; }
    }

    .empty-state { text-align: center; padding: 2rem; color: #475569; font-size: 0.85rem; }
  `]
})
export class ProductListComponent {
  @Input({ required: true }) productsList: ProductAudit[] = [];
  
  // Parâmetros de controle de processo sênior
  @Input() isBlind: boolean = true;  // Por padrão, a contagem é cega!
  @Input() isClosed: boolean = false; // Vira true quando o operador pede para encerrar o lote

  @Output() triggerPhotoCapture = new EventEmitter<ProductAudit>();
}