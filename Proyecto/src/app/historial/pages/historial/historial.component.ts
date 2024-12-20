import { Component } from '@angular/core';
import { HistorialService } from '../../services/historial.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Venta } from '../../../venta/models/venta-car.model';
import { SpinnerComponent } from '../../../shared/pages/spinner/spinner.component';
import { format, toZonedTime } from 'date-fns-tz';


@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, FormsModule, SpinnerComponent],
  templateUrl: './historial.component.html',
  styleUrls: ['./historial.component.css']
})
export class HistorialComponent {
  ventas: Venta[] = [];
  ventaSeleccionada: any | null = null; // Cambiado a any para incluir los detalles del producto
  productos: any[] = []; // Lista de productos
  fechaSeleccionada: Date = new Date(); // Fecha seleccionada como objeto Date
  ventasPorPagina: number = 10;
  paginaActual: number = 1;
  isLoading: boolean = false; // Para controlar la visualización del spinner
  productoSeleccionado: any | null = null;


  informacionDelDia: any = {
    efectivo: 0,
    transferencia: 0,
    tarjeta: 0,
    otro: 0,
    totalProductos: 0,
    totalPrecio: 0,
    totalVentas: 0 // Inicializa totalVentas
  };


  constructor(private historialService: HistorialService) { }

  ngOnInit(): void {
    this.cargarProductos(); // Cargar productos al iniciar
    this.navegarHoy(); // Cargar ventas de hoy al iniciar
  }

  cargarProductos(): void {
    this.historialService.getVentasProductVenta().subscribe(
      (data) => {
        this.productos = data.map(item => item.product); // Almacenar la lista de productos
      },
      (error) => {
        console.error('Error al obtener productos', error);
      }
    );
  }

  cargarVentas(): void {
    this.isLoading = true;
    const timeZone = 'America/Santiago'; // Zona horaria de Chile

    this.historialService.getVentas().subscribe(
      (data: Venta[]) => {
        // Obtener la fecha seleccionada
        const fechaSeleccionada = new Date(this.fechaSeleccionada);

        // Filtrar las ventas para que solo se muestren las que coincidan con la fecha seleccionada
        this.ventas = data
          .map(venta => {
            const fechaUTC = new Date(venta.fecha); // Fecha original en UTC
            const fechaLocal = toZonedTime(fechaUTC, timeZone); // Convertir a hora local en Chile

            // Formatear la fecha de la venta en el formato YYYY-MM-DD
            const fechaVentaFormateada = format(fechaLocal, 'yyyy-MM-dd');

            // Convertir la fecha seleccionada al mismo formato para la comparación
            const fechaSeleccionadaFormateada = format(fechaSeleccionada, 'yyyy-MM-dd');

            // Si la fecha de la venta coincide con la fecha seleccionada, incluirla
            if (fechaVentaFormateada === fechaSeleccionadaFormateada) {
              return {
                ...venta,
                fecha: fechaVentaFormateada // Guardamos solo la fecha (sin hora) para comparación futura
              };
            }

            return null; // Si no coincide, devolver null
          })
          .filter(venta => venta !== null) // Eliminar los nulls (ventas que no coinciden con la fecha seleccionada)
          .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

        this.isLoading = false; // Detener el spinner cuando termine de cargar
      },
      (error) => {
        console.error('Error al obtener ventas', error);
        this.isLoading = false; // Detener el spinner en caso de error
      }
    );
  }





  filtrarVentasPorFecha(): void {
    if (!this.fechaSeleccionada) {
      this.isLoading = true;
      console.log("No hay fecha seleccionada, cargando todas las ventas");
      this.cargarVentas();
    } else {
      const fechaFiltro = new Date(this.fechaSeleccionada);
      const fechaFiltroFormateada = fechaFiltro.toISOString().split('T')[0];

      console.log("Filtrando ventas para la fecha: ", fechaFiltroFormateada);

      this.historialService.getVentas().subscribe(
        (data: Venta[]) => {
          console.log("Ventas originales: ", data);

          this.ventas = data.filter(venta => {
            const fechaVenta = toZonedTime(new Date(venta.fecha), 'America/Santiago');
            const fechaVentaFormateada = format(fechaVenta, 'yyyy-MM-dd');

            console.log(`Fecha venta: ${fechaVentaFormateada}, Fecha filtro: ${fechaFiltroFormateada}`);
            return fechaVentaFormateada === fechaFiltroFormateada;
          }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

          console.log("Ventas filtradas: ", this.ventas);

          this.informacionDelDia = this.calcularResumenDelDia(this.ventas); // Calcular el resumen

          this.paginaActual = 1;
          this.isLoading = false;
        },
        (error) => {
          console.error('Error al obtener ventas por fecha', error);
          this.isLoading = false;
        }
      );
    }
  }

  calcularResumenDelDia(ventas: Venta[]): any {
    const resumen = {
      efectivo: 0,
      transferencia: 0,
      tarjeta: 0,
      otro: 0,
      totalProductos: 0,
      totalPrecio: 0,
      totalVentas: 0 // Añadir el campo para contar las ventas
    };

    ventas.forEach((venta) => {
      const totalVenta = typeof venta.total === 'number' ? venta.total : parseFloat(venta.total);

      if (!isNaN(totalVenta)) {
        resumen.totalProductos += this.obtenerCantidadTotal(venta.productos);
        resumen.totalPrecio += totalVenta;
        resumen.totalVentas += 1; // Incrementa el contador de ventas

        switch (venta.metodo_pago) {
          case 'EFECTIVO':
            resumen.efectivo += totalVenta;
            break;
          case 'TRANSFERENCIA':
            resumen.transferencia += totalVenta;
            break;
          case 'TARJETA':
            resumen.tarjeta += totalVenta;
            break;
          case 'OTRO':
            resumen.otro += totalVenta;
            break;
        }
      }
    });

    return resumen;
  }

  // Método que verifica si el día siguiente es válido
  esDiaSiguienteNoValido(): boolean {
    // Obtener la fecha actual
    const fechaHoy = new Date();

    // Comprobar si la fecha seleccionada es hoy o posterior
    const fechaSeleccionada = new Date(this.fechaSeleccionada);

    // Comparar si la fecha seleccionada es mayor o igual a hoy (no se puede navegar al día siguiente si aún no es ese día)
    return fechaSeleccionada >= fechaHoy; // Si la fecha seleccionada es hoy o después, deshabilitar el botón
  }

  navegarHoy(): void {
    this.isLoading = true;
    const hoy = new Date();
    this.fechaSeleccionada = hoy;  // Ahora es un objeto Date
    this.filtrarVentasPorFecha(); // Filtrar ventas por la fecha actual
  }

  cambiarDiaSiguiente(): void {
    this.isLoading = true;
    const fecha = new Date(this.fechaSeleccionada);
    fecha.setDate(fecha.getDate() + 1);
    this.fechaSeleccionada = fecha;  // Ahora es un objeto Date
    this.filtrarVentasPorFecha();
  }

  cambiarDiaAnterior(): void {
    this.isLoading = true;
    const fecha = new Date(this.fechaSeleccionada);
    fecha.setDate(fecha.getDate() - 1);
    this.fechaSeleccionada = fecha;  // Ahora es un objeto Date
    this.filtrarVentasPorFecha();
  }

  obtenerCantidadTotal(productos: any[]): number {
    return productos.reduce((total, producto) => total + producto.cantidad, 0);
  }

  abrirModal(venta: any): void {
    this.ventaSeleccionada = venta;
  }

  cerrarModal(): void {
    this.ventaSeleccionada = null;
  }

  abrirModalProducto(venta: Venta): void {
    // Asignar todos los productos de la venta seleccionada a la variable productoSeleccionado
    this.productoSeleccionado = venta.productos;
  }


  cerrarModalProducto() {
    this.productoSeleccionado = null;
  }



  getVentasParaMostrar(): Venta[] {
    const inicio = (this.paginaActual - 1) * this.ventasPorPagina;
    return this.ventas.slice(inicio, inicio + this.ventasPorPagina);
  }

  obtenerNumeroVenta(i: number): number {
    const indiceGlobal = (this.paginaActual - 1) * this.ventasPorPagina + i + 1;
    return this.ventas.length - indiceGlobal + 1; // Para que el número sea decreciente
  }

  siguientePagina(): void {
    if (this.hayMasVentas()) {
      this.paginaActual++;
    }
  }

  paginaAnterior(): void {
    if (this.hayPaginasPrevias()) {
      this.paginaActual--;
    }
  }

  hayMasVentas(): boolean {
    return this.paginaActual * this.ventasPorPagina < this.ventas.length;
  }

  hayPaginasPrevias(): boolean {
    return this.paginaActual > 1;
  }

  private formatearFecha(fecha: Date): string {
    return fecha.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  }

  // Método para obtener el producto por ID
  obtenerProductoPorId(productId: string) {
    return this.productos.find(producto => producto.id === productId);
  }

  formatCurrency(value: any): string {
    if (typeof value === 'number') {
      return `$${value.toFixed(0)}`;
    } else if (typeof value === 'string') {
      const numberValue = parseFloat(value); // Convierte la cadena a número
      return isNaN(numberValue) ? '$0' : `$${numberValue.toFixed(0)}`;
    }
    return '$0'; // Valor por defecto si no es un número ni una cadena válida
  }

  getColorMetodoPago(metodo_pago: string): string {
    switch (metodo_pago) {
      case 'EFECTIVO':
        return 'bg-green-500'; // Verde para efectivo
      case 'TRANSFERENCIA':
        return 'bg-blue-500'; // Azul para transferencia
      case 'TARJETA':
        return 'bg-purple-500'; // Morado para tarjeta
      case 'OTRO':
        return 'bg-gray-500'; // Gris para otros
      default:
        return 'bg-gray-300'; // Color por defecto si no coincide
    }
  }
}
