import { Component, ViewChild, ElementRef, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Product } from '../../../products/models/product.model';
import { VentaService } from '../../service/venta.service';
import { CommonModule } from '@angular/common';
import { v4 as uuidv4 } from 'uuid';


@Component({
  selector: 'app-ventas',
  templateUrl: './venta.component.html',
  styleUrls: ['./venta.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule],
})
export class VentaComponent {
  @ViewChild('codigoBarraInput') codigoBarraInput!: ElementRef;
  @ViewChild('montoInput') montoInput!: ElementRef; // Agrega esta línea para la referencia al input
  searchTerm: string = '';
  productosFiltrados: Product[] = [];
  carrito: { product: Product; cantidad: number }[] = [];
  totalPrecio: number = 0;
  userID: string = '';
  errorMessage: string = '';
  horaCarrito: string | null = null;

   // Propiedades para el modal
   modalAbierto: boolean = false;
   montoIngresado: number = 0;

  constructor(private ventaService: VentaService) {
    this.cargarProductos();
  }

  ngOnInit(): void {
    this.obtenerUserID();
    this.enfocarInput(); // Enfoca el input al inicializar el componente
  }

  // Escuchar clics en el documento
  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    // Si el clic no fue en el input, vuelve a enfocarlo
    if (!this.codigoBarraInput.nativeElement.contains(target)) {
      this.enfocarInput();
    }
  }

  obtenerUserID(): void {
    this.ventaService.checkStatus().subscribe(
      (response) => {
        this.userID = response.id;
      },
      (error) => {
        console.error('Error al verificar el estado del userID:', error);
      }
    );
  }

  cargarProductos() {
    this.ventaService.getProducts().subscribe(
      (productos: Product[]) => {
        this.productosFiltrados = productos; // Cargar todos los productos
      },
      (error) => {
        console.error("Error al obtener los productos:", error);
        this.errorMessage = "Error al cargar los productos. Intenta de nuevo más tarde.";
      }
    );
  }

  filtrarProductos() {
    // Si searchTerm está vacío, carga todos los productos
    if (this.searchTerm.trim() === '') {
      this.cargarProductos();
      return;
    }

    this.productosFiltrados = this.productosFiltrados.filter(producto =>
      producto.title?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      producto.barcode?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  agregarProductoDesdeBusqueda() {
    const productoEncontrado = this.productosFiltrados.find(
      producto => producto.barcode === this.searchTerm || producto.title === this.searchTerm
    );

    if (productoEncontrado) {
      this.agregarAlCarrito(productoEncontrado);
      this.searchTerm = ''; // Limpia el término de búsqueda
      this.filtrarProductos(); // Refresca la lista de productos para mostrar todos
      this.enfocarInput(); // Enfoca el input después de agregar
    } else {
      this.errorMessage = "Producto no encontrado.";
      console.log("Producto no encontrado.");
    }
  }

  agregarAlCarrito(producto: any) {
    const itemEnCarrito = this.carrito.find(item => item.product.id === producto.id);

    if (itemEnCarrito) {
      // Si ya existe en el carrito, verifica si se puede aumentar la cantidad
      if (itemEnCarrito.cantidad < producto.stock) {
        itemEnCarrito.cantidad++;
        // producto.stock--; // Disminuye el stock del producto (eliminado)
      } else {
        alert('No puedes agregar más de este producto. Stock máximo alcanzado.');
      }
    } else {
      // Si no está en el carrito, verifica el stock
      if (producto.stock > 0) {
        this.carrito.push({ product: producto, cantidad: 1 });
        // producto.stock--; // Disminuye el stock del producto (eliminado)
      } else {
        alert('No puedes agregar este producto. Stock agotado.');
      }
    }
    this.actualizarTotal();
  }

  eliminarDelCarrito(item: { product: Product; cantidad: number }) {
    const existingItem = this.carrito.find(carritoItem => carritoItem.product.id === item.product.id);

    if (existingItem) {
      // const producto = this.productosFiltrados.find(p => p.id === item.product.id); (eliminado)

      if (existingItem.cantidad > 1) {
        // Reducir la cantidad en 1
        existingItem.cantidad--;
      } else {
        // Si la cantidad es 1, eliminar el producto del carrito
        this.carrito = this.carrito.filter(carritoItem => carritoItem.product.id !== item.product.id);
      }
    }

    this.actualizarTotal();
    this.enfocarInput(); // Enfoca el input después de eliminar
  }

  actualizarTotal() {
    this.totalPrecio = this.carrito.reduce((total, item) => {
      return total + (item.product.ventaPrice * item.cantidad);
    }, 0);
  }

  procesarVenta() {
    if (this.carrito.length === 0) {
      this.errorMessage = "No hay productos en el carrito";
      console.error(this.errorMessage);
      return;
    }

    if (!this.userID) {
      this.errorMessage = "El ID del usuario no está disponible.";
      console.error(this.errorMessage);
      return;
    }

    const venta = {
      userId: this.userID,
      productos: this.carrito.map(item => ({
        productId: item.product.id || '',
        cantidad: item.cantidad,
        ventaPrice: item.product.ventaPrice // Precio del producto
      }))
    };
    console.log("Objeto venta a enviar:", venta); // Verifica la estructura


    this.ventaService.crearVenta(venta).subscribe(
      response => {
        console.log("Venta creada con éxito:", response);
        this.reiniciarCarrito(); // Reinicia el carrito y la hora
        this.horaCarrito = null; // Reinicia la hora del carrito
        this.errorMessage = ''; // Limpia cualquier mensaje de error
      },
      error => {
        this.errorMessage = "Error al crear la venta. Verifica los detalles e intenta de nuevo.";
        console.error("Error al crear la venta:", error);
      }
    );
  }

  reiniciarCarrito() {
    this.carrito = [];
    this.totalPrecio = 0;
    this.horaCarrito = null; // Reinicia la hora del carrito aquí también
    this.enfocarInput(); // Enfoca el input al reiniciar el carrito

  }

  enfocarInput() {
    setTimeout(() => {
      this.codigoBarraInput.nativeElement.focus(); // Enfoca el input utilizando ViewChild
    }, 0); // Usar un timeout para asegurar el enfoque
  }


  abrirModal() {
    this.modalAbierto = true;
    this.enfocarInputMonto(); // Enfocar el input de monto al abrir el modal
    this.codigoBarraInput.nativeElement.blur(); // Quitar el foco del input de código de barras
  }

  enfocarInputMonto() {
    setTimeout(() => {
      this.montoInput.nativeElement.focus(); // Enfocar el input de monto
    }, 0);
  }

  cerrarModal() {
    this.modalAbierto = false;
    this.montoIngresado = 0; // Limpiar monto al cerrar
    this.codigoBarraInput.nativeElement.focus(); // Regresar el foco al input de código de barras
  }
  confirmarMonto() {
    if (this.montoIngresado > 0) {
      const productoEspecial = {
        id: '' + Date.now(), // Generar un ID único para este "producto"
        title: 'Otro', // Nombre del producto
        ventaPrice: this.montoIngresado, // Precio del producto será el monto ingresado
        stock: 1 // Puedes definir el stock como 1 para que solo se pueda agregar una vez
      };

      // Agregar el producto especial al carrito
      this.agregarAlCarrito(productoEspecial);

      this.cerrarModal(); // Cerrar el modal después de agregar el producto
    } else {
      this.errorMessage = "Por favor, ingresa un monto válido.";
    }
  }

}
