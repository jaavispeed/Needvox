import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../../../../products/models/product.model'; // Verifica que la ruta sea correcta
import { environment } from '../../../../../environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class TotalProductosService {
  private apiUrl = `${environment.apiUrl}/products/productAdmin`;

  constructor(private http: HttpClient) {}

  obtenerProductos(): Observable<Product[]> {
    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}` // Añade el token en el encabezado
    });

    return this.http.get<Product[]>(this.apiUrl, { headers });
  }
}
