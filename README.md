# google-form-aprovval

## Creación

- Se crea un formulario en google drive y luego se presiona en los 3 puntos y se clickea en el botón Editor de secuencias de comandos.

- Esto es para linkear el formulario al script de google.

- Luego se crean los archivos con sus nombres correspondientes y se pega el código en cada uno.

- En el archivo app.gs hay un boton desplegable al lado de depuración en la barra de arriba, en donde uno ahí debe seleccionar `createTrigger` y luego presionar el boton de `Ejecutar`

- Una vez realizado los pasos anteriores, en el archivo app.gs se deben editar los correos, nombres y cargos correspondientes lo que sería un flujo de aprobaciones según la opción que el usuario elija en el formulario.

## Implementación

- Antes de implementar se deben modificar los correos a utilizar segun cada flujo.

- En this.flowHeader = "Department", se debe reemplazar el `Department` por el titulo del campo que sera el seleccionable para el flujo de aprobaciones.

- En this.sheetname = "Form Responses 1", se debe reemplazar `Form Responses 1` por el nombre que tenga el sheet en la esquina inferior izquierda el el sheet. (comunmente es Respuestas de formulario 1)

- Se clickea en el boton en la esquina superior derecha que dice `Implementar`, se presiona en nueva implementación, se debe seleccionar en la tuerca de configuración `Aplicación Web`, luego se le asigna una descripción y se le da a implementar.

- Se debe copiar la URL de aplicación web y pegar en el archivo app.gs en `this.url` que dice `PONER URL LUEGO DE IMPLEMENTAR AQUÍ`
