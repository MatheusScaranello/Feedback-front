"use client"; // Indica que este componente será renderizado no lado do cliente. Essencial para interatividade em aplicações React que utilizam Server Components.

import styles from './footerPage.module.css'; // Importa os estilos do módulo CSS, garantindo que as classes CSS sejam localmente escopadas ao componente para evitar conflitos.

const Footer = () => { // Define o componente funcional Footer, que representa a seção de rodapé da aplicação.
    return (
        <footer className={styles.footer}> {/* Renderiza um elemento <footer> e aplica a classe de estilo correspondente do módulo CSS. */}
            <p className={styles.footerp}> {/* Renderiza um parágrafo <p> dentro do footer, utilizando a classe de estilo específica para o texto do rodapé. */}
                Copyright 2024 © Todos os direitos reservados. {/* Texto que informa sobre os direitos autorais, essencial para conformidade legal. */}
            </p>
        </footer>
    );
};

export default Footer; // Exporta o componente Footer como padrão, permitindo que seja facilmente importado e utilizado em outras partes da aplicação.