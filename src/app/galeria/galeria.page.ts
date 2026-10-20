import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, 
  IonContent, IonGrid, IonRow, IonCol, IonCard 
} from '@ionic/angular';
import { SupabaseService } from '../services/supabase';

@Component({
  selector: 'app-galeria',
  templateUrl: './galeria.page.html',
  styleUrls: ['./galeria.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, 
    IonContent, IonGrid, IonRow, IonCol, IonCard
  ]
})
export class GaleriaPage implements OnInit {
  private supabaseService = inject(SupabaseService);
  private cdr = inject(ChangeDetectorRef); // <-- Añadimos el detector de cambios
  images: string[] = [];

  async ngOnInit() {
    console.log('1. Pidiendo imágenes al bucket...');
    
    // Pedimos las imágenes
    this.images = await this.supabaseService.getImages();
    
    console.log('2. Imágenes recibidas:', this.images);
    
    // Forzamos a Angular a pintar las tarjetas en la pantalla
    this.cdr.detectChanges(); 
  }
}