import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NavbarService } from '../../services/navbar.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'] // Corrige 'styleUrl' a 'styleUrls'
})
export default class NavbarComponent implements OnInit {
  router = inject(Router);
  isUserMenuOpen = false; // Propiedad para controlar el menú de usuario
  isAdmin: boolean = false;
  isLoggedIn: boolean = false;

  ngOnInit(): void {
    const roles = JSON.parse(localStorage.getItem('roles') || '[]');
    this.isAdmin = roles.includes('admin'); // Verificar si es administrador
    this.isLoggedIn = !!localStorage.getItem('token'); // Verificar si está logueado
  }

  userRole: string[] = [];


  constructor(private navbarService: NavbarService){}

  ngOnInit(): void {
    this.obtenerRole();
  }

  toggleMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen; // Alterna el estado del menú
  }

  logout(): void {
    console.log("Entró en el logout");
    localStorage.removeItem('token');
    localStorage.removeItem('roles'); // Elimina los roles del localStorage
    this.router.navigate(['/']); // Redirigir al home
  }


  obtenerRole(): void {
    this.navbarService.checkStatus().subscribe(
      (response) => {
        this.userRole= response.roles; // Asumiendo que el backend devuelve el username
      },
      (error) => {
        console.error('Error al verificar el rol', error);
      }
    );
  }

}
