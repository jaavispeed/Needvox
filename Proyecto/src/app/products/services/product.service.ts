import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private apiUrl = 'http://localhost:3000/api/products';

  constructor(private httpClient: HttpClient) {}

  // Obtener todos los productos
  getProducts(): Observable<any[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.httpClient.get<any[]>(this.apiUrl, { headers });
  }

  // Crear un producto
  createProduct(productData: {
    title: string;
    compraPrice: number;
    ventaPrice: number;
    stock: number;
    slug: string;
    expiryDate?: string
  }): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.httpClient.post<any>(this.apiUrl, productData, { headers });
  }

  // Obtener un producto por ID
  getProductById(id: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.httpClient.get<any>(`${this.apiUrl}/${id}`, { headers });
  }

  // Actualizar un producto
  updateProduct(id: string, productData: {
    title: string;
    compraPrice: number;
    ventaPrice: number;
    stock: number;
    slug: string;
    expiryDate?: string
  }): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // Crea un objeto de producto para actualizar
    const updatedProductData = {
      title: productData.title,
      compraPrice: productData.compraPrice,
      ventaPrice: productData.ventaPrice,
      stock: productData.stock,
      slug: productData.slug,
      expiryDate: productData.expiryDate // Asegúrate de incluir expiryDate
    };

    return this.httpClient.patch<any>(`${this.apiUrl}/${id}`, updatedProductData, { headers });
  }

  // Eliminar un producto
  deleteProduct(id: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.httpClient.delete<any>(`${this.apiUrl}/${id}`, { headers });
  }
}
