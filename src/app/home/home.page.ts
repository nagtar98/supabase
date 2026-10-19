import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Client } from '../models/client.model';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel,
  IonItemSliding, IonItemOptions, IonItemOption, IonIcon, IonButton,
  IonInput, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonToast
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { createOutline, trashOutline } from 'ionicons/icons';
import { SupabaseService } from '../services/supabase';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonLabel, IonItemSliding, IonItemOptions, IonItemOption,
    IonIcon, IonButton, IonInput, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    IonToast
  ],
})
export class HomePage implements OnInit {
  private supabaseService = inject(SupabaseService);
  private fb = inject(FormBuilder);

  clients: Client[] = [];
  clientForm: FormGroup;
  editingClientId: string | null = null;
  toastMessage = '';
  isToastOpen = false;

  // Señales expuestas a la vista
  isAdmin = this.supabaseService.userRole;

  constructor() {
    addIcons({ createOutline, trashOutline });
    this.clientForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      empresa: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  async ngOnInit() {
    // IMPORTANTE: Pon aquí las credenciales de tu usuario administrador de Supabase
    await this.loadClients();
  }

  async loadClients() {
    try {
      this.clients = await this.supabaseService.getClients();
    } catch (e: any) {
      this.showToast('Error cargando clientes: ' + e.message);
    }
  }

  async saveClient() {
    if (this.clientForm.invalid) return;
    try {
      const formValue = this.clientForm.value;
      if (this.editingClientId) {
        await this.supabaseService.updateClient(this.editingClientId, formValue);
        this.showToast('Cliente actualizado');
      } else {
        await this.supabaseService.createClient(formValue);
        this.showToast('Cliente insertado');
      }
      this.resetForm();
      await this.loadClients();
    } catch (e: any) {
      this.showToast('Error de guardado (¿Eres admin?): ' + e.message);
    }
  }

  editClient(client: Client) {
    this.editingClientId = client.id!;
    this.clientForm.patchValue({
      nombre: client.nombre,
      empresa: client.empresa,
      email: client.email
    });
  }

  async deleteClient(id: string) {
    try {
      await this.supabaseService.deleteClient(id);
      this.showToast('Cliente eliminado');
      await this.loadClients();
    } catch (e: any) {
      this.showToast('Error eliminando: ' + e.message);
    }
  }

  resetForm() {
    this.clientForm.reset();
    this.editingClientId = null;
  }

  setToastOpen(isOpen: boolean) {
    this.isToastOpen = isOpen;
  }

  showToast(msg: string) {
    this.toastMessage = msg;
    this.isToastOpen = true;
  }
}