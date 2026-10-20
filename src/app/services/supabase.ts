import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { Client } from '../models/client.model';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  public currentUser = signal<User | null>(null);
  public userRole = signal<'admin' | 'user' | null>(null);

constructor() {
    this.supabase = createClient(
      'https://qxkuwlumnlplidovtcwb.supabase.co',
      'sb_publishable_hV5dlhfTpejUrvxAomXHnw_1O_d-HVE',
      {
        auth: {
          persistSession: false // <--- ESTO DESACTIVA EL GUARDADO DE LA SESIÓN
        }
      }
    );
    this.initSession();
  }

  // --- AUTENTICACIÓN Y ROLES ---
  private async initSession() {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (session?.user) {
      this.currentUser.set(session.user);
      await this.loadRole(session.user.id);
    }
  }

  async login(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) {
      this.currentUser.set(data.user);
      await this.loadRole(data.user.id);
    }
  }
async logout() {
    await this.supabase.auth.signOut();
    this.currentUser.set(null);
    this.userRole.set(null);
  }

private async loadRole(userId: string) {
    console.log('1. Intentando leer rol para el ID:', userId);
    const { data, error } = await this.supabase
      .from('perfiles')
      .select('role')
      .eq('id', userId)
      .single();

    console.log('2. Respuesta de perfiles -> Data:', data, ' | Error:', error);

    if (!error && data) {
      this.userRole.set(data.role);
      console.log('3. Rol asignado correctamente como:', data.role);
    } else {
      console.log('ERROR CRÍTICO: No se pudo asignar el rol');
    }
  }

  // --- CRUD CLIENTES ---
  async getClients(): Promise<Client[]> {
    console.log('4. Intentando leer clientes...');
    const { data, error } = await this.supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('5. Respuesta de clientes -> Data:', data, ' | Error:', error);

    if (error) throw error;
    return data || [];
  }
  async createClient(client: Client): Promise<void> {
    const { error } = await this.supabase.from('clientes').insert([{
      nombre: client.nombre,
      empresa: client.empresa,
      email: client.email
    }]);
    if (error) throw error;
  }

  async updateClient(id: string, client: Partial<Client>): Promise<void> {
    const { error } = await this.supabase.from('clientes').update(client).eq('id', id);
    if (error) throw error;
  }

  async deleteClient(id: string): Promise<void> {
    const { error } = await this.supabase.from('clientes').delete().eq('id', id);
    if (error) throw error;
  }
  async getImages(): Promise<string[]> {
    // Listamos los archivos del bucket 'galeria'
    const { data, error } = await this.supabase.storage.from('galeria').list();
    if (error) {
      console.error('Error cargando imágenes:', error);
      return [];
    }

    // Filtramos carpetas vacías y generamos la URL pública para cada imagen
    return data
      .filter(item => item.name !== '.emptyFolderPlaceholder')
      .map(file => {
        return this.supabase.storage.from('galeria').getPublicUrl(file.name).data.publicUrl;
      });
  }
}