import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Client } from '../models/client.model';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel,
  IonItemSliding, IonItemOptions, IonItemOption, IonIcon, IonButton, IonButtons,
  IonInput, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonToast,
  IonSpinner, IonBadge 
} from '@ionic/angular';
import { RouterModule } from '@angular/router';
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
    IonToast, IonSpinner, IonBadge, 
    IonButtons, RouterModule
  ],
})
export class HomePage implements OnInit {
  private supabaseService = inject(SupabaseService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef); // <-- Añadido el detector de cambios

  clients: Client[] = [];
  clientForm: FormGroup;
  loginForm: FormGroup; // <-- Nuevo formulario para el login
  editingClientId: string | null = null;
  toastMessage = '';
  isToastOpen = false;
  isLoading = false;

  // Señales expuestas a la vista
  isAdmin = this.supabaseService.userRole;
  currentUser = this.supabaseService.currentUser; // <-- Para saber si está logueado

  constructor() {
    addIcons({ createOutline, trashOutline });
    
    // Formulario de Clientes
    this.clientForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      empresa: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });

    // Formulario de Login
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async ngOnInit() {
    // Si la sesión se recupera automáticamente de la memoria, cargamos los clientes
    setTimeout(async () => {
      if (this.currentUser()) {
        await this.loadClients();
      }
      this.cdr.detectChanges(); // <-- FUERZA A PINTAR LA PANTALLA
    }, 800); // Subimos ligeramente el tiempo para dar margen a initSession()
  }

  async doLogin() {
    if (this.loginForm.invalid) return;
    this.isLoading = true;
    try {
      const { email, password } = this.loginForm.value;
      
      // 1. Esperamos a que el login termine
      await this.supabaseService.login(email, password);
      
      // 2. AHORA SÍ, pedimos los clientes (después de saber que somos admin)
      await this.loadClients(); 
      
      this.showToast('Login correcto como Administrador');
    } catch (e: any) {
      this.showToast('Error de login: ' + e.message);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges(); // <-- FUERZA A PINTAR LA PANTALLA AL ACABAR
    }
  }

  async loadClients() {
    try {
      this.clients = await this.supabaseService.getClients();
      this.cdr.detectChanges(); // <-- FUERZA A MOSTRAR LA LISTA DE CLIENTES
    } catch (e: any) {
      this.showToast('Error cargando clientes: ' + e.message);
    }
  }

  async doLogout() {
    await this.supabaseService.logout();
    this.showToast('Sesión cerrada correctamente');
    this.cdr.detectChanges(); // Forzamos repintar para que desaparezca el formulario
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