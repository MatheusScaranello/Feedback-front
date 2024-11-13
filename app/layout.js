import "./globals.css"; // Importa o arquivo de estilos globais que será aplicado a toda a aplicação

// Define metadados para a aplicação, que podem ser utilizados para SEO e informações da página
export const metadata = {
  title: "Senai - Valinhos", // Título da página
  description: "Feedback de avaliações", // Descrição da página
};

// Função RootLayout define o layout raiz da aplicação
export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR"> {/* Define o idioma da página como português do Brasil */}
      <body>
        {children} {/* Renderiza os filhos que são passados para este componente */}
      </body>
    </html>
  );
}