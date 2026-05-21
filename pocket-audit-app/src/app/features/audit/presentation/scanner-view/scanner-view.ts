import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';

@Component({
  selector: 'app-scanner-view',
  standalone: true,
  imports: [CommonModule, ZXingScannerModule],
  templateUrl: './scanner-view.html',
  styleUrls: ['./scanner-view.scss']
})
export class ScannerViewComponent {
  // Evento que avisa a página pai que um produto foi bipado
  @Output() barcodeScanned = new EventEmitter<string>();

  // Força o leitor a focar apenas em códigos de barras tradicionais de produtos (EAN-13 / EAN-8)
  // Isso evita falsos positivos e deixa a leitura muito mais rápida
  public allowedFormats = [
    BarcodeFormat.EAN_13, 
    BarcodeFormat.EAN_8, 
    BarcodeFormat.CODE_128
  ];

  public hasPermission = false;
  public showScanner = true;

  // Executado quando a câmera decodifica um código com sucesso
  public handleScanSuccess(resultString: string): void {
    if (resultString) {
      // Emite o som de "bip" nativo para dar feedback ao operador
      this.playBeepSound();
      this.barcodeScanned.emit(resultString.trim());
    }
  }

  // Monitora se o usuário deu permissão para acessar a câmera
  public onHasPermission(permission: boolean): void {
    this.hasPermission = permission;
  }

  // Beep sonoro de confirmação idêntico aos coletores Zebra/Honeywell
  private playBeepSound(): void {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime); // Tom agudo de bip
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.08); // Bip curto de 80ms
  }
}