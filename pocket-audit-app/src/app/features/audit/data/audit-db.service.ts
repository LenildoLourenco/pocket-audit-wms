import { Injectable } from '@angular/core';
import { openDB, IDBPDatabase } from 'idb';
import { ProductAudit } from '../domain/product.model';

@Injectable({
  providedIn: 'root'
})
export class AuditDbService {
  private dbPromise: Promise<IDBPDatabase>;

  constructor() {
    this.dbPromise = openDB('PocketAuditWMS', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('products')) {
          db.createObjectStore('products', { keyPath: 'barcode' });
        }
      },
    });
  }

  async getAllProducts(): Promise<ProductAudit[]> {
    const db = await this.dbPromise;
    return db.getAll('products');
  }

  async saveProduct(product: ProductAudit): Promise<void> {
    const db = await this.dbPromise;
    await db.put('products', product);
  }

  // Implementação sênior do salvamento em lote (Bulk)
  async saveBulk(products: ProductAudit[]): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction('products', 'readwrite');
    const store = tx.objectStore('products');
    
    for (const product of products) {
      await store.put(product);
    }
    
    await tx.done;
  }

  async clearDatabase(): Promise<void> {
    const db = await this.dbPromise;
    await db.clear('products');
  }
}