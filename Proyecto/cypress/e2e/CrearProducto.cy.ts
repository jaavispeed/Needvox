describe('Página de inicio', () => {
  beforeEach(() => {
    // Visitar la página de inicio antes de cada prueba
    cy.visit('https://needvox.com/home');
  });
  describe('Pruebas de registro y login', () => {
    const username = 'usuario_ihvsy@gmail.com';
    const password = '123456';

   it('debería registrarse y luego iniciar sesión con las mismas credenciales', () => {
    // Abrir el modal de registrs
    cy.contains('Ingresar').click();

    // Completar el formulario de login con las credenciales usadas para el registro
    cy.get('input[name="email"]').type(username);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();

    // Verificar si el login fue exitoso
    cy.contains('Bienvenido').should('exist'); // Cambia el mensaje si es diferente
    cy.wait(8000); // Espera 1 segundo (1000 ms)
    cy.contains('Productos').click();
    //Dirigir a crear productos
    cy.contains('Agregar Producto').click();
    // Verificar que los campos están vacíos antes de comenzar
    cy.get('[formControlName="title"]').should('have.value', '');

    cy.get('[formControlName="precioVenta"]').should('have.value', '');
    cy.get('[formControlName="barcode"]').should('have.value', '');

    // Rellenar el formulario
    cy.get('[formControlName="title"]').type('Producto de Prueba 2');
    cy.get('[formControlName="precioVenta"]').type('1000');
    cy.get('[formControlName="barcode"]').type('2222222');

    // Verificar que los valores se ingresaron correctamente
    cy.get('[formControlName="title"]').should('have.value', 'Producto de Prueba 2');
    cy.get('[formControlName="precioVenta"]').should('have.value', '1000');
    cy.get('[formControlName="barcode"]').should('have.value', '2222222');

    // Enviar el formulario
    cy.get('button[type="submit"]').click();

    // Verificar que se muestra el mensaje de éxito
    cy.contains('Producto creado con éxito').should('be.visible');

  });
});
});
