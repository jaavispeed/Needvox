import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';
import { LotesService } from '../../compras/services/compras.service';
import { Lote } from '../../compras/models/lotes.models';
import { Product } from '../models/product.model';
import { environment } from '../../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`; // URL de tu API

  constructor(private httpClient: HttpClient, private lotesService: LotesService) {}

  // Configurar encabezados de autorización
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); // Obtén el token del almacenamiento local
    return new HttpHeaders({
      'Authorization': `Bearer ${token}` // Configura el encabezado de autorización
    });
  }

  getProducts(limit = 1000, offset = 0): Observable<any> {
    const headers = this.getHeaders();
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    return this.httpClient.get<any>(this.apiUrl, { headers, params }).pipe(
      tap((response) => console.log('Respuesta de productos:', response)), // Log de respuesta
      map(response => ({
        products: response.data,  // Aquí almacenamos los productos
        hasMore: response.hasMore // Y aquí el valor de "hasMore"
      })),
      switchMap((response) => {
        const productObservables = response.products.map((product: Product) => {
          return this.lotesService.getLotesByProduct(product.id ?? '').pipe(
            map((loteResponse) => {
              const lotes: Lote[] = loteResponse.lotes; // Obtenemos el arreglo de lotes

              // Aquí ya no se hace el cálculo del precio más reciente
              // Solo agregamos el producto tal como está

              return {
                ...product,
                fechaCreacion: product.fechaCreacion ? new Date(product.fechaCreacion) : new Date(), // Usamos la fecha actual si es undefined
              };
            })
          );
        });

        return forkJoin(productObservables).pipe(
          map(productsWithDates => ({
            products: productsWithDates,
            hasMore: response.hasMore,  // Seguimos pasando el "hasMore"
          }))
        );
      }),
      tap((finalResponse) => console.log('Productos con lotes:', finalResponse)),
      catchError((error) => {
        console.error('Error al obtener productos', error);
        return of({ products: [], hasMore: false }); // Retornar productos vacíos si hay error
      })
    );
  }



  // Obtener todos los productos como admin
  getProductsAdmin(limit = 10, offset = 0): Observable<any[]> {
    const headers = this.getHeaders();
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    return this.httpClient.get<any[]>(`${this.apiUrl}/admin`, { headers, params });
  }

  // Crear un producto
  createProduct(productData: {
    title: string;
    precioVenta: number; // Ahora precioVenta es obligatorio
    slug?: string; // Opcional, si se genera automáticamente en el backend
    barcode?: string | null; // Opcional
  }): Observable<any> {
    const headers = this.getHeaders();
    return this.httpClient.post<any>(this.apiUrl, productData, { headers });
  }

  // Obtener un producto por ID
  getProductById(id: string): Observable<any> {
    const headers = this.getHeaders();
    return this.httpClient.get<any>(`${this.apiUrl}/${id}`, { headers });
  }

  // Actualizar un producto
  updateProduct(id: string, productData: {
    title: string;
    precioVenta: number; // Asegúrate de que precioVenta esté en el DTO
    slug?: string; // Opcional
    barcode?: string | null; // Opcional
  }): Observable<any> {
    const headers = this.getHeaders();
    return this.httpClient.patch<any>(`${this.apiUrl}/${id}`, productData, { headers });
  }

  // Eliminar un producto
  deleteProduct(id: string): Observable<any> {
    const headers = this.getHeaders();
    return this.httpClient.delete<any>(`${this.apiUrl}/${id}`, { headers });
  }
}
