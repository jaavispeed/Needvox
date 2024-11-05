import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Product } from '../../models/product.model';
import { NgxPaginationModule } from 'ngx-pagination';
import { AlertComponent } from '../../../shared/pages/alert/alert.component';

@Component({
  selector: 'app-crud-product',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule, ReactiveFormsModule, AlertComponent],
  templateUrl: './crud-product.component.html',
  styleUrls: ['./crud-product.component.css']
})
export class CrudProductComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  currentPage = 1;
  itemsPerPage = 10;
  product: Product = { title: '', stockTotal: 0, slug: '', user: { id: '' }, barcode: null };
  isEditing: boolean = false;
  isModalOpen: boolean = false;
  searchTerm: string = '';
  alertVisible: boolean = false;
  alertMessage: string = '';
  alertType: 'success' | 'error' = 'success';
  crudForm: FormGroup;
  showConfirm: boolean = false;
  productIdToDelete: string | null = null;
  selectedProduct: Product | null = null; // Almacena el producto seleccionado
  totalStock: number = 0;

  constructor(private productService: ProductService, private cdr: ChangeDetectorRef) {
    this.crudForm = new FormGroup({
      title: new FormControl('', [Validators.required, Validators.minLength(3)]),
      slug: new FormControl(''),
      barcode: new FormControl(null)
    });
  }

  ngOnInit(): void {
    this.getProducts();
  }

  getProducts(): void {
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data.map(product => ({
          ...product,
          fechaCreacion: new Date(product.fechaCreacion).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'America/Santiago'
          })
        }));
        this.filteredProducts = this.products;
      },
      error: () => this.showAlert('Error al obtener los productos.', 'error')
    });
  }

  // Métodos de paginación
  get paginatedProducts(): Product[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredProducts.slice(startIndex, startIndex + this.itemsPerPage);
  }

  nextPage(): void {
    if (this.hasMorePages()) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  hasMorePages(): boolean {
    return this.currentPage * this.itemsPerPage < this.filteredProducts.length;
  }

  totalPages(): number {
    return Math.ceil(this.filteredProducts.length / this.itemsPerPage);
  }

  promptDelete(id: string): void {
    this.productIdToDelete = id;
    this.showConfirm = true;
  }

  confirmDelete(): void {
    if (this.productIdToDelete) {
      this.productService.deleteProduct(this.productIdToDelete).subscribe({
        next: () => {
          console.log(`Producto ${this.productIdToDelete} eliminado con éxito`);

          // Eliminar el producto de la lista localmente
          this.products = this.products.filter(product => product.id !== this.productIdToDelete);
          this.filteredProducts = this.filteredProducts.filter(product => product.id !== this.productIdToDelete);

          this.showAlert('Producto eliminado con éxito.', 'success');
        },
        error: () => this.showAlert('Error al eliminar el producto.', 'error'),
        complete: () => this.resetConfirmation() // Reinicia la confirmación solo después de que la eliminación ha sido procesada
      });
    } else {
      this.resetConfirmation(); // Si no hay ID, también reinicia
    }
  }

  cancelDelete(): void {
    this.resetConfirmation();
  }

  private resetConfirmation(): void {
    this.showConfirm = false;
    this.productIdToDelete = null;
  }

  createOrUpdateProduct(): void {
    if (this.crudForm.invalid) {
      this.showAlert('Por favor completa todos los campos correctamente.', 'error');
      return;
    }

    const productToSend = {
      ...this.crudForm.value,
      barcode: this.crudForm.value.barcode === '' ? null : this.crudForm.value.barcode
    };

    if (this.isEditing) {
      this.productService.updateProduct(this.product.id!, productToSend).subscribe({
        next: () => {
          this.onSuccess('Producto actualizado con éxito.', 'success');
          this.closeModal(); // Cerrar el modal después de actualizar
        },
        error: (error) => this.handleError(error, 'actualizar')
      });
    } else {
      this.productService.createProduct(productToSend).subscribe({
        next: () => {
          this.onSuccess('Producto creado con éxito.', 'success');
          this.closeModal(); // Cerrar el modal después de crear
        },
        error: (error) => this.handleError(error, 'crear')
      });
    }
  }

  private handleError(error: any, action: 'crear' | 'actualizar'): void {
    const errorMessage = error.error?.message || 'Error desconocido';
    console.log('Error recibido:', error);

    switch (error.status) {
      case 400:
        if (errorMessage.includes('Nombre ya creado')) {
          this.showAlert('El nombre del producto ya existe.', 'error');
        } else if (errorMessage.includes('Código de barras ya creado')) {
          this.showAlert('El código de barras ya existe.', 'error');
        } else {
          this.showAlert(`Error al ${action} el producto: ${errorMessage}`, 'error');
        }
        break;
      case 500:
        this.showAlert(`Error interno al ${action} el producto. Intente nuevamente más tarde.`, 'error');
        break;
      default:
        this.showAlert('Ocurrió un error inesperado. Intente nuevamente.', 'error');
    }
  }

  private onSuccess(message: string, type: 'success' | 'error'): void {
    this.showAlert(message, type);
    this.getProducts(); // Refresca la lista de productos
    this.resetForm();
  }

  private showAlert(message: string, type: 'success' | 'error'): void {
    this.alertMessage = message;
    this.alertType = type;
    this.alertVisible = true;

    setTimeout(() => {
      this.alertVisible = false;
    }, 3000); // Ocultar el mensaje después de 3 segundos
  }

  private resetForm(): void {
    this.crudForm.reset();
    this.isEditing = false;
    this.product = { title: '', stockTotal: 0, slug: '', user: { id: '' }, barcode: null };
  }

  editProduct(product: Product): void {
    this.product = product;
    this.isEditing = true;
    this.crudForm.patchValue({
      title: product.title,
      slug: product.slug,
      barcode: product.barcode
    });
    this.isModalOpen = true; // Abre el modal
  }

  onSearchTermChange(): void {
    this.filteredProducts = this.products.filter(product =>
      product.title.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  filterProducts(): void {
    if (this.searchTerm) {
      this.filteredProducts = this.products.filter(product =>
        product.title.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    } else {
      this.filteredProducts = this.products; // Restablece la lista si no hay término de búsqueda
    }
  }

  openModal(): void {
    this.resetForm(); // Resetea el formulario antes de abrir el modal
    this.isModalOpen = true; // Cambia el estado para abrir el modal
  }

  closeModal(): void {
    this.isModalOpen = false; // Cambia el estado para cerrar el modal
    this.resetForm(); // Resetea el formulario al cerrar
  }
}
