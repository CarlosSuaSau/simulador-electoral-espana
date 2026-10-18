# Publicación gratuita

La aplicación es estática: React, mapas y simulaciones se ejecutan en el navegador. No necesita base de datos, servidor de cálculo ni claves de API. Los escenarios de cada visitante permanecen en su navegador.

## GitHub Pages

Es la opción recomendada para este proyecto independiente. GitHub Free permite Pages en repositorios públicos. La dirección gratuita será `https://TU_USUARIO.github.io/TU_REPOSITORIO/`; un dominio propio es opcional y se contrata aparte.

1. Crear un repositorio público en GitHub y subir el proyecto, incluido `.github/workflows/pages.yml` y `package-lock.json`. No subir `node_modules` ni `dist`; están excluidos por `.gitignore`.
2. Utilizar `main` como rama principal, o adaptar el nombre en el workflow.
3. En **Settings → Pages → Build and deployment → Source**, seleccionar **GitHub Actions**.
4. Ejecutar **Actions → Publicar en GitHub Pages → Run workflow**, o enviar un cambio a `main`.
5. Abrir la dirección que devuelve el paso de despliegue. El workflow comprueba las pruebas, compila y publica únicamente `dist`.

Vite usa rutas relativas (`base: './'`), compatibles con la subcarpeta del repositorio. Los workers de simulación también se compilan como archivos estáticos. La navegación no utiliza rutas que necesiten un servidor especial.

Las encuestas se distribuyen con el código: para actualizarlas hay que revisar el catálogo y volver a desplegar. Compartir el enlace no comparte los escenarios guardados de otra persona; para eso se utiliza la descarga e importación de escenarios.

Documentación consultada el 18 de octubre de 2026:

- [GitHub Pages: disponibilidad y funcionamiento](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [Límites de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
- [Publicación mediante GitHub Actions](https://docs.github.com/en/pages/getting-started-with-github-pages/using-github-actions-for-github-pages)

## Alternativa: Cloudflare Pages

También admite este sitio estático en el plan gratuito. Puede conectarse al repositorio o recibir directamente el contenido de `dist` después de ejecutar `npm run build`. En una conexión Git, usar `npm run build` y `dist` como directorio de salida. Su documentación indica 500 compilaciones mensuales, hasta 20.000 archivos y un máximo de 25 MiB por archivo en el plan gratuito.

- [Límites oficiales de Cloudflare Pages](https://developers.cloudflare.com/pages/platform/limits/)

## Comprobación local

```powershell
npm.cmd ci
npm.cmd test
npm.cmd run build
npm.cmd run preview -- --host 127.0.0.1
```

El servidor de desarrollo se inicia con `npm.cmd run dev -- --host 127.0.0.1 --port 5173`.

Repositorio: https://github.com/CarlosSuaSau/simulador-electoral-espana

Destino de publicación: https://carlossuasau.github.io/simulador-electoral-espana/. Cada cambio en main ejecuta las pruebas y publica mediante GitHub Actions.
